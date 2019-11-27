import React, { Component } from "react";
import "../styles/UserForm.css";

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class UserForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            roomName: "",
            password: "",
            type: ""
        };

        this.handleChange = this.handleChange.bind(this);
        // this.handleSubmit = this.handleSubmit.bind(this);
        this.changeSubmitType = this.changeSubmitType.bind(this);
    }

    handleChange(event) {
        event.preventDefault();
        let target = event.target;
        let value = target.value;
        let name = target.name;
        
        this.setState({
            [name]: value
        });

        
    }

    async createRoom() {
        console.log("creating");
        let send = {
            username: this.state.username,
            roomName: this.state.roomName,
            roomPass: this.state.password
        };
        let url =
            window.location.protocol +
            "//" +
            window.location.hostname +
            ":" +
            window.location.port +
            "/room/create";

        let resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(send)
        });
        window.sessionStorage.setItem("username", this.state.username);
        let respData = await resp.json();
        this.props.gotoRoom(respData.roomId);
    }

    async joinRoom() {
        console.log("joining");
        let send = {
            username: this.state.username,
            roomName: this.state.roomName,
            roomPass: this.state.password
        };
        let url =
            window.location.protocol +
            "//" +
            window.location.hostname +
            ":" +
            window.location.port +
            "/room/join";

        let resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(send)
        });
        console.log(send);
        let respData = await resp.json();
        window.sessionStorage.setItem("username", this.state.username);
        if (respData.ok !== true) {
            alert("wrong pass");
        } else {
            this.props.gotoRoom(respData.roomId);
        }
    }

    changeSubmitType(event) {
        event.preventDefault();
        let value = event.target.value.toLowerCase();
        this.setState({
            type: value
        });
        if (value === "create") {
            this.createRoom();
        } else if (value === "join") {
            this.joinRoom();
        }
    }

    render() {
        return (
            <div>
                <form className="UserForm">
                    <div className="inputs">
                        <input
                            autoComplete="off"
                            className="inputBeat"
                            type="text"
                            name="username"
                            value={this.state.value}
                            onChange={this.handleChange}
                            placeholder="Username"
                        />
                        <input
                            autoComplete="off"
                            className="inputBeat"
                            type="text"
                            name="roomName"
                            value={this.state.value}
                            onChange={this.handleChange}
                            placeholder="Room Name"
                        />
                        <input
                            className="inputBeat"
                            type="password"
                            name="password"
                            value={this.state.value}
                            onChange={this.handleChange}
                            placeholder="Password"
                        />
                    </div>
                    <div className="buttons">
                        <button className="buttonBeat" value="Create" onClick={this.changeSubmitType}>
                            Create
                        </button>
                        <button className="buttonBeat" value="Join" onClick={this.changeSubmitType}>
                            Join
                        </button>
                    </div>
                </form>
            </div>
        );
    }
}

export default UserForm;
