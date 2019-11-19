import React, { Component } from "react";
import ReactDOM from "react-dom";
import UserForm from "./UserForm";
import Room from "./Room";
import "../styles/App.css";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            renderForm: true,
            renderRoom: false
        };
        this.gotoRoom = this.gotoRoom.bind(this);
    }

    gotoRoom(roomId) {
        this.setState({ renderForm: false });
        let room = "/room/" + roomId;
        window.history.pushState(null, "room", room);
        this.setState({ renderRoom: true });
    }

    renderForm() {}

    render() {
        return (
            <div className="App">
                {this.state.renderForm ? (
                    <UserForm
                        className="UserForm"
                        state={this.state}
                        gotoRoom={this.gotoRoom}
                    ></UserForm>
                ) : null}
                {this.state.renderRoom ? (
                    <Room className="Room" state={this.state}></Room>
                ) : null}
            </div>
        );
    }
}

export default App;
