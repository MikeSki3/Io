import React from 'react';
import ReactDOM from 'react-dom';
import Mopidy from 'mopidy';
import config from './../config/config.json'

var mopidy = new Mopidy({
  webSocketUrl: "ws://localhost:6680/mopidy/ws"
});

mopidy.on(console.log.bind(console));
mopidy.on('state:online', function(){
  window.mopidy = mopidy;
});

function parseTrack(track) {
  var track = track.track;
  return {
    "name": track.name,
    "artist": track.artists[0].name,
    "album": track.album.name,
    "uri": track.uri
  }
}

function populateComponent(comp, data){
  comp.setState(prevState => ({
  "tracks": data.map((track) => 
    <QueueEntry track={parseTrack(track)}  key={track.track.uri + "_" + track.tlid}/>
  ) 
  }));
}

class Queue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      "tracks": [],
      "songsPresent": true
    };
  }

  componentDidMount() {
    var queue = this;
    mopidy.on("state:online", function(){
      mopidy.tracklist.getTlTracks().then(function(data){
        if(data.length > 0) {
          populateComponent(queue, data);
        } else {
          queue.setState({
            "songsPresent": false
          })
        }
      });
    });
  }

  render() {
    var queue = this;
    mopidy.on('event:tracklistChanged', function(){
      mopidy.tracklist.getTlTracks().then(function(data){
                if(data.length > 0) {
          populateComponent(queue, data);
        } else {
          queue.setState({
            "songsPresent": false
          })
        }
      });
    });
    const queueTable = (
      <table className="queue">
      <tbody>
        {this.state.tracks}
      </tbody>
    </table>
    )
    return (
      (this.state.songsPresent) ? queueTable : <p className="queue">No songs in queue</p>
    )
  }
}

class QueueHeader extends React.Component {
  render() {
    return (
      <tr>
          <th>
            Track
          </th>
          <th>
            Artist
          </th>
          <th>
            Album
          </th>
        </tr>
    )
  }
}

class QueueEntry extends React.Component {
  constructor(props){
    super(props);
    var playing = (props.currentlyPlaying) ? true : false;
    this.state = {
      currentlyPlaying: playing,
      track: props.track
    };

    this.changePlayState = this.changePlayState.bind(this);
  }

  changePlayState() {

  }

  render() {
    const currentlyPlaying = this.state.currentlyPlaying;
    const track = this.state.track;

    return (
        <tr className={(currentlyPlaying) ? "queue-entry active" : "queue-entry"}>
          <td>{track.name}</td>
          <td>{track.artist}</td>
          <td>{track.album}</td>
        </tr>
    );
  }
}

class PageHeader extends React.Component {
  render() {
    return (
      <div className="page-header">
        <p>
          To begin getting crunk, text ur song dreams to dis guy -> {config.TWILIO_NUM_PRETTY}
        </p>
      </div>
    )
  }
}

class NowPlaying extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      "track": (props.track) ? props.track : {},
      "isPlaying": true
    }
  }

  getCurrentTrack(curr){
    mopidy.playback.getCurrentTlTrack().then(function (data) {
      if (data != null) {
        var track = parseTrack(data);
        mopidy.library.getImages([track.uri]).then(function (data) {
          track.artUri = data[track.uri][0].uri;
          curr.setState({
            "track": track
          })
        });
      } else {
        var track = {
          "artUri": "./img/coolAlbumArt.png",
          "name": "Nothing",
          "artist": "Nada",
          "album": "Zilch"
        }
        curr.setState({
          "track": track,
          "isPlaying": false
        })
      }
    })
  }

  render(){
    var curr = this;
    mopidy.on("state:online", function(){
      curr.getCurrentTrack(curr);
      mopidy.on("event:trackPlaybackStarted", function(){
        this.getCurrentTrack(curr);
      });
    });
    const nowPlayingDiv = (
      <div className="now-playing">
        <img src={this.state.track.artUri} />
        <div>{this.state.track.name}</div>
        <div>{this.state.track.artist}</div>
        <div>{this.state.track.album}</div>
      </div>
    )
    return (
      nowPlayingDiv
    )
  }
}

class App extends React.Component {
  render() {
    return (
      <div>
        <PageHeader />
        <div className="play-area">
          <Queue />
          <NowPlaying />
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);