'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var mopidy = require('./mopidyApi/api.js');

var config = require('./config/config');
var twilio = require('twilio');

var app = express();

var actions = {
    play: {
        text: "$play",
        action: function(twiml, res){
            let message = "Playing..."
            mopidy.playQueue();
            sendResponse(twiml, res, message);
        }
    },
    pause: {
        text: "$pause",
        action: function(twiml, res){
            let message = "Pausing...";
            mopidy.pauseQueue();
            sendResponse(twiml, res, message);
        }
    },
    next: {
        text: "$next",
        action: function(twiml, res){
            let message = "Playing next...";
            mopidy.playNextTrack();
            sendResponse(twiml, res, message);
        }
    },
}

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: config.SESSION_SECRET
}));

app.post('/sms', function (req, res) {
    console.log(req.body.Body);
    let textBod = req.body.Body;
    let phoneNum = req.body.From;

    if (!req.session.users) {
        req.session.users = {};
    }
    var songs = req.session.users[phoneNum];

    var twiml = new twilio.TwimlResponse();
    var message = "";
    if(isAction(textBod)){
        performAction(twiml, res, textBod);
    } else if (songs) {
        makeSelection(textBod, phoneNum, twiml, req, res, message, songs);
    } else {
        search(textBod, phoneNum, twiml, req, res, message);
    }
});

function isAction(textBod){
    return textBod == actions.play.text || textBod == actions.pause.text || textBod == actions.next.text;
}

function performAction(twiml, res, textBod){
    let playbackAction = textBod.toLowerCase().substring(1);
    actions[playbackAction].action(twiml, res);
}

function sendResponse(twiml, res, message) {
    twiml.message(message);
    res.writeHead(200, {
        'Content-Type': 'text/xml'
    });
    res.end(twiml.toString());
}

function makeSelection(textBod, phoneNum, twiml, req, res, message, songs) {
    if(textBod == "!"){
        message = "Oh shit you don canceled it!";
        delete req.session.users[phoneNum];
    } else if (!isNaN(textBod) && textBod >= 0 && textBod < songs.length) {
        message = "Queueing up: " + songs[textBod].title + " - " + songs[textBod].artist;
        mopidy.addToQueue(songs[textBod].uri, true);
        delete req.session.users[phoneNum];
    } else {
        message = "Don't be an ass, just make a song choice...or '!' to cancel";
    }
    sendResponse(twiml, res, message);
}

function search(textBod, phoneNum, twiml, req, res, message) {
    req.session.users[phoneNum] = [];
    mopidy.searchMopidy(textBod).then(function (results) {
        message = "Respond with song choice or '!' to cancel\n";
        let tracks = results[0].tracks;
        let limit = tracks.length < 3 ? tracks.length : 3;
        for (var i = 0; i < limit; i++) {
            message += i + ": " + tracks[i].name + " - " + tracks[i].artists[0].name + "\n";
            req.session.users[phoneNum].push({
                "uri": tracks[i].uri,
                "title": tracks[i].name,
                "artist": tracks[i].artists[0].name
            });
        }
        sendResponse(twiml, res, message);
    });
}

app.listen(3000, function () {
    console.log('Listenting on port 3000');
})