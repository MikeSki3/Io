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
  render() {
    return (
    <table className="queue">
      <tbody>
        <QueueHeader />
        <QueueEntry />
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
      currentlyPlaying: playing
    };

    this.changePlayState = this.changePlayState.bind(this);
  }

  changePlayState() {

  }

  render() {
    const currentlyPlaying = this.state.currentlyPlaying;

    return (
        <tr className={(currentlyPlaying) ? "queue-entry active" : "queue-entry"}>
          <td>Humble</td>
          <td>Kendrick Lamar</td>
          <td>DAMN.</td>
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