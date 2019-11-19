const socketIO = require("socket.io");
const idGen = require("uniqid");

class RoomHandler {
    constructor(server, router) {
        this.io = socketIO(server);
        this.rooms = new Map();
        this.server = server;
        this.router = router;
        this.setRouting();
    }

    /**
     *
     * @param {*} data --data has roomName, roomPass, user
     * Creates the room adds it to rooms
     * @returns --roomId
     */
    createRoom(data) {
        let roomId = idGen();
        let room = {
            roomId: roomId,
            roomName: data.roomName,
            roomPass: data.roomPass,
            users: new Map(),
            sockets: [],
            src: null
        };
        //pushing the room admin to users
        room.users.set(data.username, 0);
        room.users.size;
        //pushing the created room to rooms
        this.rooms.set(roomId, room);
        return roomId;
    }

    /**
     *
     * @param {*} data --
     * adds user to room if the pass matches
     */
    addUserToRoom(data, roomId) {
        // let roomId = data.roomId;
        let room = this.rooms.get(roomId);
        if (room.roomPass !== data.roomPass) {
            return false;
        }
        room.users.set(data.username, 0);
        return true;
    }

    getRoomIdFromName(roomName) {
        for (const iterator of this.rooms.entries()) {
            if (iterator[1].roomName === roomName) {
                return iterator[0];
            }
        }
        return false;
    }

    setRouting() {
        /**
         * Socket connection
         */
        this.io.on("connection", socket => {
            console.log("a user connected with id:" + socket.id);

            let roomId;
            let username;

            //second response
            socket.on("userData", data => {
                console.log(data);
                if (data.info) {
                    roomId = data.roomId;
                    username = data.username;
                    //when the room id has come insert the values
                    let room = this.rooms.get(roomId);
                    //adds the socket to sockets
                    room.sockets.push(socket);
                    //adds the user to users
                    let user = {
                        username: username,
                        socket: socket,
                        admin: false
                    };
                    if (room.users.size == 1) {
                        user.admin = true;
                    }

                    room.users.set(username, user);
                    if (room.src != null) {
                        socket.emit("sourceChange", { src: room.src });                        
                    }
                }
            });

            socket.on("disconnect", () => {
                console.log("disconnected user id:" + socket.id);
                let room = this.rooms.get(roomId);
                //remove the user from the room.users
                room.users.delete(username);
                let userCount = room.users.size;
                console.log("Room user count:" + userCount);
                //if nobody is left at the room delete the room
                if (userCount <= 0) {
                    this.rooms.delete(roomId);
                }

            });

            socket.on("pause", data => {
                console.log(data);
                let room = this.rooms.get(data.roomId);
                for (const privateSocket of room.sockets) {
                    if (privateSocket !== socket) {
                        console.log("pausing id:" + privateSocket.id);
                        privateSocket.emit("pause");
                    }
                }
            });

            socket.on("resume", data => {
                console.log(data);
                let room = this.rooms.get(data.roomId);
                for (const privateSocket of room.sockets) {
                    if (privateSocket !== socket) {
                        console.log("resuming id:" + privateSocket.id);
                        privateSocket.emit("resume");
                    }
                }
            });

            socket.on("seek", data => {
                console.log(data);
                let room = this.rooms.get(data.roomId);
                for (const privateSocket of room.sockets) {
                    if (privateSocket !== socket) {
                        console.log("seeking id:" + privateSocket.id);
                        privateSocket.emit("seek", { currentTime: data.currentTime });
                    }
                }
            });

            socket.on("sourceChange", data => {
                console.log(data);
                console.log(roomId);
                let room = this.rooms.get(roomId);
                room.src = data.src;
                for (const privateSocket of room.sockets) {
                    if (privateSocket !== socket) {
                        console.log("src id:" + privateSocket.id);
                        privateSocket.emit("sourceChange", { src: data.src });
                    }
                }
            });


            socket.on("message", data => {
                let room = this.rooms.get(roomId);
                for (const privateSocket of room.sockets) {
                    privateSocket.emit("message", data);
                }
            });


        });

        console.log("seting routing");
        this.router.post("/create", (req, res, next) => {
            console.log("creating");
            console.log(req.body);
            let roomId = this.createRoom(req.body);
            res.send({
                roomId: roomId
            });
        });

        this.router.post("/join", (req, res, next) => {
            console.log("joining");
            console.log(req.body);

            let roomId = this.getRoomIdFromName(req.body.roomName);
            console.log(roomId);
            if (!roomId) {
                res.send("cant find room");
            }
            let passTrue = this.addUserToRoom(req.body, roomId);
            if (passTrue) {
                console.log("pass true");
                res.send({ ok: true, roomId: roomId });
            } else {
                res.send({ ok: "wrong pass", roomId: roomId });
            }
        });
    }
}

module.exports = RoomHandler;
