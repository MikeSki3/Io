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

class Queue extends React.Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   "tracks": [],
    //   "songsPresent": true
    // };
  }

  // componentDidMount() {
  //   var queue = this;
  //   mopidy.on("state:online", function(){
  //     mopidy.tracklist.getTlTracks().then(function(data){
  //       if(data.length > 0) {
  //         populateComponent(queue, data);
  //       } else {
  //         queue.setState({
  //           "songsPresent": false
  //         })
  //       }
  //     });
  //   });
  // }

  render() {
    // var queue = this;
    // mopidy.on('event:tracklistChanged', function(){
    //   mopidy.tracklist.getTlTracks().then(function(data){
    //     if(data.length > 0) {
    //       populateComponent(queue, data);
    //     } else {
    //       queue.setState({
    //         "songsPresent": false
    //       })
    //     }
    //   });
    // });
    const queueTable = (
      <table className="queue">
      <tbody>
        {this.props.tracks}
      </tbody>
    </table>
    )
    return (
      (this.props.tracks.length > 0) ? queueTable : <p className="queue">No songs in queue</p>
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
    // var playing = (props.currentlyPlaying) ? true : false;
    // this.state = {
    //   currentlyPlaying: playing,
    //   track: props.track
    // };

    // this.changePlayState = this.changePlayState.bind(this);
  }

  // changePlayState(data) {
  //   var track = data.tl_track;
  //   var key = track.track.uri + "_" + track.tlid;
  //   this.setState({
  //     currentlyPlaying: (key == this.props.track.key) ? true : false
  //   })
  // }

  render() {
    const currentlyPlaying = this.props.nowPlaying;
    const track = this.props.track;
    const entry = this;
    // mopidy.on("event:trackPlaybackStarted", function(data){
    //   entry.changePlayState(data);
    // });
    // mopidy.on("event:trackPlaybackResumed", function(data){
    //   entry.changePlayState(data);
    // });
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
      mopidy.on("event:trackPlaybackStarted", function(data){
        curr.getCurrentTrack(curr);
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

function getTracksArray(nowPlayingKey, data){
  var tracks = [];
  for(var i = 0; i < data.length; i++){
    var track = parseTrack(data[i]);
    tracks.push(<QueueEntry track={track}  key={track.key} nowPlaying={nowPlayingKey == track.key}/>);
  }
  return tracks;
}

function getNewQueueTracks(app){
  var nowPlayingKey = (app.state.nowPlaying) ? app.state.nowPlaying.key : {};
  mopidy.tracklist.getTlTracks().then(function (data) {
    if (data.length > 0) {
      app.setState({
        "tracks": getTracksArray(nowPlayingKey, data)
      });
    } else {
      app.setState({
        "tracks": []
      })
    }
  });
}

function changeQueuePlayState(app, data){
  var currTrack = parseTrack(data.tl_track);
  // var currTracks = app.state.tracks;
  // for(var i = 0; i < currTracks.length; i++){
  //   if(currTrack.key == currTracks[i].props.track.key){
  //     currTracks[i].setState({
  //       "nowPlaying": true
  //     })
  //   } else {
  //     currTracks[i].setState({
  //       "nowPlaying": false
  //     })
  //   }
  // }
  // console.log(app);
  // console.log(app.state.tracks);
  app.setState({
    "nowPlaying": currTrack
  })
}

function setEvents(app){
   mopidy.on('event:tracklistChanged', function(){
    getNewQueueTracks(app);
   });

   mopidy.on("event:trackPlaybackStarted", function(data){
      changeQueuePlayState(app, data);
    });
    mopidy.on("event:trackPlaybackResumed", function(data){
      changeQueuePlayState(app, data);
    });
}

function initUi(app){
  mopidy.on("state:online", function(){
    window.mopidy = mopidy;
    getNewQueueTracks(app);

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
          <Queue tracks={this.state.tracks} curr={this.state.nowPlaying}/>
          <NowPlaying curr={this.state.nowPlaying}/>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);