import React from "react";
import Authentication from "../../util/Authentication/Authentication";

import "./App.css";

const IMG_PATH = "img/monkaS.png";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.Authentication = new Authentication();

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = {
      finishedLoading: false,
      theme: "light",
      isVisible: true,
      hypeTrain: false,
      hypeTrainLength: 0
    };

    this.toggleTrain = this.toggleTrain.bind(this);
    this.lengthenTrain = this.lengthenTrain.bind(this);
  }

  contextUpdate(context, delta) {
    if (delta.includes("theme")) {
      this.setState(() => {
        return { theme: context.theme };
      });
    }
  }

  visibilityChanged(isVisible) {
    this.setState(() => {
      return {
        isVisible
      };
    });
  }

  componentDidMount() {
    if (this.twitch) {
      this.twitch.onAuthorized(auth => {
        this.Authentication.setToken(auth.token, auth.userId);
        if (!this.state.finishedLoading) {
          // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

          // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
          this.setState(() => {
            return { finishedLoading: true };
          });
        }
      });

      this.twitch.listen("broadcast", (target, contentType, body) => {
        this.twitch.rig.log(
          `New PubSub message!\n${target}\n${contentType}\n${body}`
        );
        // now that you've got a listener, do something with the result...
        switch (body) {
          case "startHypeTrain":
            return this.setState(state => ({
              hypeTrain: true,
              hypeTrainLength: 1
            }));
          case "stopHypeTrain":
            return this.setState(state => ({
              hypeTrain: false,
              hypeTrainLength: 0
            }));
          case "LengthenTrain":
            return this.setState(state => ({
              hypeTrainLength: hypeTrainLength + 1
            }));
        }
        // do something...
      });

      this.twitch.onVisibilityChanged((isVisible, _c) => {
        this.visibilityChanged(isVisible);
      });

      this.twitch.onContext((context, delta) => {
        this.contextUpdate(context, delta);
      });
    }
  }

  componentWillUnmount() {
    if (this.twitch) {
      this.twitch.unlisten("broadcast", () =>
        console.log("successfully unlistened")
      );
    }
  }

  toggleTrain() {
    this.setState(state => {
      if (state.hypeTrain) {
        return { hypeTrain: false, hypeTrainLength: 0 };
      }
      return { hypeTrain: true, hypeTrainLength: 1 };
    });
  }

  lengthenTrain() {
    this.setState(state => {
      return {
        hypeTrainLength:
          state.hypeTrainLength < 20 ? state.hypeTrainLength + 1 : 20
      };
    });
  }

  render() {
    if (this.state.finishedLoading && this.state.isVisible) {
      return (
        <div className="App">
          <div
            className={this.state.theme === "light" ? "App-light" : "App-dark"}
          >
            <div className="header" />
            <div className="main">
              <p>My token is: {this.Authentication.state.token}</p>
              <p>My opaque ID is {this.Authentication.getOpaqueId()}.</p>
              <div>
                {this.Authentication.isModerator() ? (
                  <p>
                    I am currently a mod, and here's a special mod button{" "}
                    <input value="mod button" type="button" />
                  </p>
                ) : (
                  "I am currently not a mod."
                )}
              </div>
              <p>
                I have{" "}
                {this.Authentication.hasSharedId()
                  ? `shared my ID, and my user_id is ${this.Authentication.getUserId()}`
                  : "not shared my ID"}
                .
              </p>
            </div>
            <button onClick={this.toggleTrain}>Toggle Train</button>
            <button onClick={this.lengthenTrain}>Lengthen Train</button>
            <div className="footer">
              <div>
                <HypeTrain
                  show={this.state.hypeTrain}
                  count={this.state.hypeTrainLength}
                />
              </div>
              <div>
                <ArrivalText count={this.state.hypeTrainLength} />
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return <div className="App" />;
    }
  }
}

function HypeTrain(props) {
  if (!props.show) return null;
  var depths = [];
  for (var i = 1; i < props.count; i++) {
    depths.push(i);
  }
  console.log(props);
  return (
    <div>
      {depths.map(i => trainBody(i)).reverse()}
      {trainHead()}
    </div>
  );
}

function trainHead() {
  return (
    <img
      src={IMG_PATH}
      width="10%"
      height="10%"
      z-index="0"
      style={{ marginLeft: "-5px" }}
      key={`train-0`}
    />
  );
}

function trainBody(depth) {
  return (
    <img
      src={IMG_PATH}
      width="5%"
      height="5%"
      z-index={-depth}
      style={{ marginLeft: "-5px" }}
      key={`train-${depth}`}
    />
  );
}

function ArrivalText(props) {
  if (props.count !== 20) return null;
  return <p style={{ textAlign: "center" }}>WE MADE IT!!!</p>;
}
