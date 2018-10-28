import React from "react";
import Authentication from "../../util/Authentication/Authentication";

import "./App.css";

const IMG_PATH = "img/monkaS.png";
const IMAGES = ["img/monkaS.png", "img/fed.png", "img/kappa.png"];

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
      hypeTrainLength: 0,
      experienceLevel: 0,
      imageIndex: 0,
      trophies: []
    };
    this.incrementExp = this.incrementExp.bind(this);
    this.toggleTrain = this.toggleTrain.bind(this);
    this.lengthenTrain = this.lengthenTrain.bind(this);
    this.nextImage = this.nextImage.bind(this);
    this.assignMostTroll = this.assignMostTroll.bind(this);
    this.assignJebaited = this.assignJebaited.bind(this);
    this.assignPogChamp = this.assignPogChamp.bind(this);
    this.assignBestViewer = this.assignBestViewer.bind(this);
    this.assignResidentSleeper = this.assignResidentSleeper.bind(this);
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
        console.log(auth);
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
        console.log(`New PubSub message!\n${target}\n${contentType}\n${body}`);
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
          case "lengthenHypeTrain":
            return this.lengthenTrain();
          case "incrementExp":
            return this.incrementExp();
          case "nextImage":
            return this.nextImage();
          case "assignTrophies":
            return this.setState(state => ({

              if (body) {
                {/*Add trophies depending on body here */}
              }

            }));
        }
        // do something...
      });

      this.twitch.onVisibilityChanged((isVisible, _c) => {
        this.visibilityChanged(isVisible);
      });

      this.twitch.onContext((context, delta) => {
        this.contextUpdate(context, delta);
        console.log(context);
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

  incrementExp() {
    this.setState(state => {
      return {
        experienceLevel: state.experienceLevel + 1
      };
    });
  }

  nextImage() {
    this.setState(state => {
      return {
        imageIndex: 
          state.imageIndex == IMAGES.length ? 0 : state.imageIndex + 1; 
      };
    });
  }

  assignMostTroll() {
    this.setState(state => {
      if (state.trophies.includes("Most Troll")) {
        return { trophies: state.trophies };
      }
      var addedtrophies = state.trophies;
      addedtrophies.push("Most Troll");
      return {
        trophies: addedtrophies
      };
    });
  }

  assignJebaited() {

    this.setState(state => {
      if (state.trophies.includes("Jebaited")) {
        return { trophies: state.trophies };
      }
      var addedtrophies = state.trophies;
      addedtrophies.push("Jebaited");
      return {
        trophies: addedtrophies
      };
    });
  }

  assignPogChamp() {

    this.setState(state => {
      if (state.trophies.includes("PogChamp")) {
        return { trophies: state.trophies };
      }
      var addedtrophies = state.trophies;
      addedtrophies.push("PogChamp");
      return {
        trophies: addedtrophies
      };
    });
  }

  assignBestViewer() {

    this.setState(state => {
      if (state.trophies.includes("BestViewer")) {
        return { trophies: state.trophies };
      }
      var addedtrophies = state.trophies;
      addedtrophies.push("BestViewer");
      return {
        trophies: addedtrophies
      };
    });
  }

  assignResidentSleeper() {

    this.setState(state => {
      if (state.trophies.includes("ResidentSleeper")) {
        return { trophies: state.trophies };
      }
      var addedtrophies = state.trophies;
      addedtrophies.push("ResidentSleeper");
      return {
        trophies: addedtrophies
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
          <div className="nono"></div>
          <div className="header">
            <div>
              <ExperienceLevel
                show={this.state.experienceLevel}
              />
              <Rank
                show={this.state.experienceLevel}
              />
              <Trophies
                show={this.state.trophies}
              />
            </div>
            <div>
              <ArrivalText count={this.state.hypeTrainLength} />
            </div>
            <div className="main">
              <p>My token is: {this.Authentication.state.token}</p>
              <p>My opaque ID is {this.Authentication.getOpaqueId()}.</p>
              <div>
                {this.Authentication.isModerator() ? (
                  <p>
                    I am currently a mod, and heres a special mod button{" "}
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
              <button onClick={this.incrementExp}>Increment Experience</button>
              <button onClick={this.toggleTrain}>Toggle Train</button>
              <button onClick={this.lengthenTrain}>Lengthen Train</button>
              <button onClick={this.nextImage}>New Emote</button>
              <button onClick={this.incrementExp}>Increment Experience</button>
              <button onClick={this.assignMostTroll}>Assign Most Troll</button>
              <button onClick={this.assignJebaited}>Assign Jebaited</button>
              <button onClick={this.assignPogChamp}>Assign PogChamp</button>
              <button onClick={this.assignBestViewer}>Assign BestViewer</button>
              <button onClick={this.assignResidentSleeper}>Assign ResidentSleeper</button>
            </div>

            <div className="footer">
              <div>
                <HypeTrain
                  show={this.state.hypeTrain}
                  count={this.state.hypeTrainLength}
                  imageIndex={this.state.imageIndex}
                />
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

function HypeTrain(props, imageIndex) {
  if (!props.show) return null;
  var depths = [];
  for (var i = 1; i < props.count; i++) {
    depths.push(i);
  }
  return (
    <div>
      {depths.map(i => trainBody(i, imageIndex)).reverse()}
      {trainHead(imageIndex)}
    </div>
  );
}

function trainHead(imageIndex) {
  return (
    <img
      src={IMAGES[imageIndex]}
      width="10%"
      height="10%"
      z-index="0"
      style={{ marginLeft: "-5px" }}
      key={`train-0`}
    />
  );
}

function trainBody(depth, imageIndex) {
  return (
    <img
      src={IMAGES[imageIndex]}
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

function ExperienceLevel(props) {
  return <div>Experience: {props.show}</div>;
}

const ranks = [
  ["Noob", 0],
  ["Experienced", 10],
  ["Master", 20],
  ["Challenger", 30],
  ["Legend", 40]
].reverse();
function Rank(props) {
  const currentExp = props.show;
  const rankIndex = ranks.findIndex(i => i[1] <= currentExp);

  return <div>Rank: {ranks[rankIndex][0]}</div>;
}

function Trophies(props) {
  console.log(props.show);
  return (
    <div>
      Trophies:
      {props.show.map(i => i)}
    </div>
  );
}
