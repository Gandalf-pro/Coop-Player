import React, { Component } from "react";
import videojs from "video.js";
import io from "socket.io-client";
import "video.js/dist/video-js.css";
import "../styles/Room.css";

class socketUtils {
    constructor(args) {
        this.socket = io(this.getSocketUrl());
        this.setSocketRouting();
        this.roomId = args.roomId;
    }

    setPlayer(player) {
        this.player = player;
    }

    getSocketUrl() {
        let protocol = window.location.protocol;
        let host = window.location.hostname;
        let port = 4000;
        let url = protocol + "//" + host + ":" + port;
        return url;
    }

    setSocketRouting() {
        this.socket.on("connect", () => {
            console.log(this.socket.id);
            let data = {
                info: true,
                roomId: this.roomId,
                username: window.sessionStorage.getItem("username")
            };
            this.sendUserData(data);
        });

        this.socket.on("seek", data => {
            console.log(data);
            let dif = Math.abs(
                this.player.player.currentTime() - data.currentTime
            );
            if (dif > 3) {
                this.player.player.currentTime(data.currentTime);
            }
        });

        this.socket.on("pause", msg => {
            //pause the player
            this.player.player.pause();
        });

        this.socket.on("resume", msg => {
            //resume the player
            this.player.player.play();
        });

        /**
         * gets the data about the room users etc.
         */
        this.socket.on("roomData", data => {
            let users = data.users;
        });

        this.socket.on("sourceChange", data => {
            console.log("Changing the  source to:" + data.src);
            this.player.player.src(data.src);
        });
    }

    sendPaused(data) {
        this.socket.emit("pause", data);
    }

    sendResume(data) {
        this.socket.emit("resume", data);
    }

    sendUserData(data) {
        this.socket.emit("userData", data);
    }

    sendSeek(data) {
        this.socket.emit("seek", data);
    }
}

function createPlayerDiv(state, setState) {
    //960 x 720
    const videoJsOptions = {
        autoplay: false,
        controls: true,
        width: 960,
        height: 720
    };

    return <Player {...videoJsOptions} state={state} setState={setState} />;
}

class Player extends Component {
    constructor(props) {
        super(props);
        this.state = {
            message: "",
            chat: []
        };
        this.socket = props.state.socket;
        this.roomId = props.state.roomId;
        console.log(this.socket);
        this.socket.setPlayer(this);
        this.changeSrc = this.changeSrc.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.recieveMessage = this.recieveMessage.bind(this);
        this.recieveMessage();
    }

    handleChange(event) {
        this.setState({ message: event.target.value });
    }

    changeSrc(event) {
        let src = document.querySelector(".srcInput").value;
        document.querySelector(".srcInput").value = "";
        console.log("Changing the source to:" + src);
        // this.player.src({ src: src, type: "video/mp4" });
        this.player.src({ src: src });
        this.socket.socket.emit("sourceChange", { src: src });
    }

    componentDidMount() {
        this.player = videojs(this.videoNode, this.props, () => {
            this.player.volume(0.3);
            console.log("Player ready");
            this.setEvents();
        });
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
    }

    createMessageDiv(data) {
        let msgDiv = (
            <p className="message">
                {data.user}:{data.message}
            </p>
        );
        this.state.chat.push(msgDiv);
        let newChat = this.state.chat;
        this.setState({ chat: newChat });
    }

    sendMessage(event) {
        let data = {
            user: window.sessionStorage.getItem("username"),
            message: this.state.message
        };
        this.setState({ message: "" });
        this.socket.socket.emit("message", data);
        console.log("sending message" + data.message);
    }

    recieveMessage() {
        this.socket.socket.on("message", data => {
            console.log("msg recieved:" + data.message);
            this.createMessageDiv(data);
        });
    }

    renderMessages() {
        console.log("rendering msgs");
        return this.state.chat;
    }

    render() {
        return (
            <div>
                <div className="main-container">
                    <div data-vjs-player>
                        <video
                            ref={node => (this.videoNode = node)}
                            className="video-js vjs-big-play-centered"
                        ></video>
                    </div>
                    <div className="chat">
                        <div className="messages">{this.renderMessages()}</div>
                        <div className="message-input">
                            <input
                                type="text"
                                className="message-send-text"
                                placeholder="Message"
                                value={this.state.message}
                                onChange={this.handleChange}
                            />
                            <button
                                className="send-message"
                                onClick={this.sendMessage}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
                <div>
                    <input
                        type="text"
                        className="srcInput"
                        placeholder="url"
                    ></input>
                    <button className="srcButton" onClick={this.changeSrc}>
                        +
                    </button>
                </div>
            </div>
        );
    }

    getPlayerData() {
        let currentTime = this.player.currentTime();
        let buffer = this.player.bufferedPercent();
        let bufferEnd = this.player.bufferedEnd();
        let roomId = this.roomId;
        return {
            roomId: roomId,
            currentTime: currentTime,
            buffer: buffer,
            bufferEnd: bufferEnd
        };
    }

    setEvents() {
        this.player.on("seeking", event => {
            console.log(event);
            let data = this.getPlayerData();
            console.log("seeking" + data);
            this.socket.sendSeek(data);
        });

        this.player.on("pause", event => {
            if (this.player.seeking()) {
                return;
            }
            let data = this.getPlayerData();
            console.log("paused" + JSON.stringify(data));
            this.socket.sendPaused(data);
        });

        this.player.on("play", event => {
            if (this.player.seeking()) {
                return;
            }
            let data = this.getPlayerData();
            console.log("playing" + JSON.stringify(data));
            this.socket.sendResume(data);
        });
    }
}

class Room extends Component {
    constructor(props) {
        super(props);
        console.log("i am here");
        let roomId = window.location.href.split("/").pop();
        window.localStorage.setItem("roomId", roomId);
        this.state = {
            roomId: roomId,
            socket: new socketUtils({ roomId: roomId })
        };
    }

    render() {
        return (
            <div className="Room">
                <h1>Welcome the the room</h1>
                {createPlayerDiv(this.state, this.setState)}
            </div>
        );
    }
}

export default Room;
