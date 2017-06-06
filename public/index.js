import React from 'react';
import ReactDOM from 'react-dom';
import Mopidy from 'mopidy';
import config from './../config/config.json'
import jquery from 'jquery';
import ProgressBar from 'progressbar.js';

var mopidy = new Mopidy({
  webSocketUrl: "ws://localhost:6680/mopidy/ws"
});
var trackProgressBar;
var timerId;

mopidy.on(console.log.bind(console));

function parseTrack(track) {
  var tlid = track.tlid;
  var track = track.track;
  return {
    "name": track.name,
    "artist": track.artists[0].name,
    "album": track.album.name,
    "uri": track.uri,
    "key": track.uri + "_" + tlid,
    "length": track.length
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
      <div className="queue-scroll">
        {(this.props.tracks.length > 0) ? queueTable : <p className="queue">No songs in queue</p>}
      </div>
    )
  }
}

class QueueEntry extends React.Component {
  // constructor(props){
  //   super(props);
  // }

  componentDidUpdate() {
    var activeEntry = jquery('.queue-entry.active');
    var scroll = jquery('.queue-scroll');
    var queue = jquery('.queue');
    if(activeEntry.length > 0){
      var position = activeEntry.offset().top;
      var posMid = activeEntry.height() / 2;
      var winMid = jquery(window).height() / 2;
      if(posMid + position > winMid){
        var currTop = parseInt(queue.css('top'));
        queue.css('top', (currTop - posMid * 2) + "px");
      } else if(position < scroll.offset().top){
        queue.css('top', (scroll.offset().top) + "px");
      }
    }
  }

  render() {
    const currentlyPlaying = this.props.nowPlaying;
    const track = this.props.track;
    return (
        <tr className={(currentlyPlaying) ? "queue-entry active" : "queue-entry"}>
          <td>
            <i className="fa fa-play" aria-hidden="true"></i>
            {track.name}
          </td>
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

// event:trackPlaybackStarted - object:tl_track
// event:trackPlaybackPaused - object: int:time_position, object:tl_track
// event:trackPlaybackResumed - object: int:time_position, object:tl_track

class NowPlaying extends React.Component {
  // constructor(props){
  //   super(props);
  // }

  componentDidMount(){
    if(!trackProgressBar) {
      trackProgressBar = new ProgressBar.Line('#progress', {
        color: '#FCB03C',
        strokeWidth: 2.5
      });
    }
  }

  render(){
    const nowPlayingDiv = (
      <div className="now-playing">
        <img src={this.props.track.artUri} />
        <div>{this.props.track.name}</div>
        <div>{this.props.track.artist}</div>
        <div>{this.props.track.album}</div>
        <div className="song-duration">
          <div className="progress" id="progress"></div>
          <div className="song-time"></div>
        </div>
      </div>
    )
    return (
      <div>
        {nowPlayingDiv}
      </div>
    )
  }
}

function getQueueEntryArray(nowPlayingKey, data){
  var tracks = [];
  for(var i = 0; i < data.length; i++){
    var track = data[i];
    console.log("Now Playing Key: " + nowPlayingKey + " Curr Track Key: " + track.key + ((nowPlayingKey == track.key) ? " DIS ONE" : ""));
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

function getCurrentTrack(app, data, currPosition, animateBar) {
  var track = {};
  var getTrackArt = function(trackMinusArt){
    // track = parseTrack((trackMinusArt.tl_track) ? trackMinusArt.tl_track : trackMinusArt);
    return mopidy.library.getImages([trackMinusArt.uri]);
  }

  if(data){
    var trackData = data;
    getTrackArt(data).then(function (data) {
      trackData.artUri = data[trackData.uri][0].uri;
      app.setState({
        "nowPlaying": trackData
      });
    });
    setProgressBar(data.length, currPosition, animateBar);
  } else {
    mopidy.playback.getCurrentTlTrack().then(function (data) {
      if (data != null) {
        track = parseTrack(data);
        getTrackArt(track).then(function (data) {
          track.artUri = data[track.uri][0].uri;
          app.setState({
            "nowPlaying": track
          });
        });
        setProgressBar(track.length, currPosition, animateBar);
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

function clearNowPlaying(app){
  var track = {
    "artUri": "./img/coolAlbumArt.png",
    "name": "Nothing",
    "artist": "Nada",
    "album": "Zilch"
  }
  app.setState({
    "nowPlaying": track
  })
  trackProgressBar.stop();
  trackProgressBar.set(0);
}

function startProgressBar(){
  trackProgressBar.animate(1);
}

function pauseProgressBar(){
  trackProgressBar.stop();
  clearInterval(timerId);
}

function setProgressBar(duration, currPosition, animateBar){
  if(trackProgressBar){
    trackProgressBar.destroy();
  }
  trackProgressBar = new ProgressBar.Line('#progress', {
    color: '#FCB03C',
    strokeWidth: 2.5,
    duration: duration
  });
  if(currPosition){
    trackProgressBar.set((currPosition/duration));
    if(animateBar){trackProgressBar.animate(1)};
    setTimer(duration, currPosition, animateBar);
  } else {
    mopidy.playback.getTimePosition().then(function (data) {
      trackProgressBar.set((data/duration));
      if(animateBar){trackProgressBar.animate(1)};
      setTimer(duration, data, animateBar);
    });
  }
}

function setTimer(duration, currTime, startTimer){
  if(timerId) {
    clearInterval(timerId);
  }
  let timerDiv = jquery(".song-time");
  let durMinutes = getMinutes(duration);
  let currMinutes = getMinutes(currTime);
  let durSeconds = getSeconds(duration);
  let currSeconds = getSeconds(currTime);

  if(startTimer){
    timerId = setInterval(function(){
      timerDiv.text(currMinutes + ":" + padNumber(currSeconds) + "/" + durMinutes + ":" + padNumber(durSeconds));
      if(currSeconds == 59) {
        currMinutes++;
        currSeconds = 0;
      } else {
        currSeconds++;
      }
    }, 1000);
  } else {
    timerDiv.text(currMinutes + ":" + padNumber(currSeconds) + "/" + durMinutes + ":" + padNumber(durSeconds));
  }
}

function padNumber(time){
  return (time < 10) ? "0" + time : time;
}

function getMinutes(timeInMiliseconds){
  return Math.floor(timeInMiliseconds/60000);
}

function getSeconds(timeInMiliseconds){
  return Math.round(((timeInMiliseconds/60000) - getMinutes(timeInMiliseconds)) * 60)
}

function setEvents(app){
   mopidy.on('event:tracklistChanged', function(){
      getNewQueueTracks(app);
   });

   mopidy.on("event:trackPlaybackStarted", function(data){
      getCurrentTrack(app, parseTrack(data.tl_track), null, true);
      // setProgressBar(data.tl_track.track.length, null, true);
    });
    
    mopidy.on("event:trackPlaybackResumed", function(data){
      getCurrentTrack(app, parseTrack(data.tl_track), data.time_position, true);
      // setProgressBar(data.tl_track.track.length, data.time_position, true);
    });

    mopidy.on("event:playbackStateChanged", function(data){
      if((data.old_state == "playing" && data.new_state == "stopped") || (data.old_state == "paused" && data.new_state == "stopped")){
        clearNowPlaying(app);
      }
    });

    mopidy.on("event:trackPlaybackPaused", function(data) {
      pauseProgressBar();
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