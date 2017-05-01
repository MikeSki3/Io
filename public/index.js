import React from 'react';
import ReactDOM from 'react-dom';
import Mopidy from 'mopidy';
import config from './../config/config.json'

var mopidy = new Mopidy({
  webSocketUrl: "ws://localhost:6680/mopidy/ws"
});

mopidy.on(console.log.bind(console));

function parseTrack(track) {
  var tlid = track.tlid;
  var track = track.track;
  return {
    "name": track.name,
    "artist": track.artists[0].name,
    "album": track.album.name,
    "uri": track.uri,
    "key": track.uri + "_" + tlid
  }
}

function populateComponent(comp, data){
  comp.setState(prevState => ({
  "tracks": data.map((track) => 
    <QueueEntry track={parseTrack(track)}  key={track.track.uri + "_" + track.tlid}/>
  ),
  "songsPresent": true 
  }));
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

class Queue extends React.Component {
  // constructor(props) {
  //   super(props);
  // }

  render() {
    var tracks = getQueueEntryArray(this.props.nowPlaying.key, this.props.tracks);
    const queueTable = (
      <table className="queue">
      <tbody>
        {tracks}
      </tbody>
    </table>
    )
    return (
      (this.props.tracks.length > 0) ? queueTable : <p className="queue">No songs in queue</p>
    )
  }
}

class QueueEntry extends React.Component {
  // constructor(props){
  //   super(props);
  // }

  render() {
    const currentlyPlaying = this.props.nowPlaying;
    const track = this.props.track;
    return (
      // <tr className={"queue-entry"}>
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
  // constructor(props){
  //   super(props);
  // }

  render(){
    const nowPlayingDiv = (
      <div className="now-playing">
        <img src={this.props.track.artUri} />
        <div>{this.props.track.name}</div>
        <div>{this.props.track.artist}</div>
        <div>{this.props.track.album}</div>
      </div>
    )
    return (
      nowPlayingDiv
    )
  }
}

function getQueueEntryArray(nowPlayingKey, data){
  var tracks = [];
  for(var i = 0; i < data.length; i++){
    var track = data[i];
    tracks.push(<QueueEntry track={track}  key={track.key} nowPlaying={nowPlayingKey == track.key}/>);
  }
  return tracks;
}

function getTracksArray(data){
    var tracks = [];
  for(var i = 0; i < data.length; i++){
    var track = parseTrack(data[i]);
    tracks.push(track);
  }
  return tracks;
}

function getNewQueueTracks(app){
  var nowPlayingKey = (app.state.nowPlaying) ? app.state.nowPlaying.key : {};
  mopidy.tracklist.getTlTracks().then(function (data) {
    if (data.length > 0) {
      app.setState({
        "tracks": getTracksArray(data)
      });
    } else {
      app.setState({
        "tracks": []
      })
    }
  });
}

function getCurrentTrack(app, data) {
  var track = {};
  var getTrackArt = function(trackMinusArt){
    track = parseTrack((trackMinusArt.tl_track) ? trackMinusArt.tl_track : trackMinusArt);
    return mopidy.library.getImages([track.uri]);
  }

  if(data){
    getTrackArt(data).then(function (data) {
      track.artUri = data[track.uri][0].uri;
      app.setState({
        "nowPlaying": track
      });
    });
  } else {
    mopidy.playback.getCurrentTlTrack().then(function (data) {
      if (data != null) {
        getTrackArt(data).then(function (data) {
          track.artUri = data[track.uri][0].uri;
          app.setState({
            "nowPlaying": track
          });
        });
      } else {
        track = {
          "artUri": "./img/coolAlbumArt.png",
          "name": "Nothing",
          "artist": "Nada",
          "album": "Zilch"
        }
      }
      app.setState({
        "nowPlaying": track
      });
    });
  }
}

function setEvents(app){
   mopidy.on('event:tracklistChanged', function(){
    getNewQueueTracks(app);
   });

   mopidy.on("event:trackPlaybackStarted", function(data){
      getCurrentTrack(app, data);
    });
    
    mopidy.on("event:trackPlaybackResumed", function(data){
      getCurrentTrack(app, data);
    });
}

function initUi(app){
  mopidy.on("state:online", function(){
    window.mopidy = mopidy;
    getNewQueueTracks(app);
    getCurrentTrack(app);
    setEvents(app);
  });
}

class App extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      "tracks": [],
      "nowPlaying": {}
    }
    initUi(this);
  }

  render() {
    return (
      <div>
        <PageHeader />
        <div className="play-area">
          <Queue tracks={this.state.tracks} nowPlaying={this.state.nowPlaying}/>
          <NowPlaying track={this.state.nowPlaying}/>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);