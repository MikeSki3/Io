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

class Queue extends React.Component {
  //this will probably have to be moved up a level so that the state of the queue can have a list of tracks
  //only a state change will update the DOM?
  render() {
    function parseTrack(track){
      var track = track.track;
      return {
        "name": track.name,
        "artist": track.artists[0].name,
        "album": track.album.name
      }
    }
    var tracks = [];
    mopidy.on('event:tracklistChanged', function(){
      mopidy.tracklist.getTlTracks().then(function(data){
        const tracks = data.map((track) => 
          <QueueEntry track={parseTrack(track)} />
        )
      });
    });

    return (
    <table className="queue">
      <tbody>
        <QueueHeader />
        {tracks}
      </tbody>
    </table>
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

class App extends React.Component {
  render() {
    return (
      <div>
        <PageHeader />
        <Queue />
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);