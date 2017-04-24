'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var mopidy = require('./mopidyApi/api.js');
// require("babel-core").transform("code", options);

var config = require('./config/config');
var twilio = require('twilio');

var app = express();

var actions = {
    play: {
        text: "$play",
        action: function (twiml, res) {
            let message = "Playing..."
            mopidy.playQueue();
            sendResponse(twiml, res, message);
        }
    },
    pause: {
        text: "$pause",
        action: function (twiml, res) {
            let message = "Pausing...";
            mopidy.pauseQueue();
            sendResponse(twiml, res, message);
        }
    },
    next: {
        text: "$next",
        action: function (twiml, res) {
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

app.use(express.static('./public'));

app.post('/sms', function (req, res) {
    console.log(req.body.Body);
    let textBod = req.body.Body;
    let phoneNum = req.body.From;

    if (!req.session.users) {
        req.session.users = {};
    }
    var currUser = req.session.users[phoneNum];

    var twiml = new twilio.TwimlResponse();
    var message = "";
    if (isAction(textBod)) {
        performAction(twiml, res, textBod);
    } else if (currUser) {
        makeSelection(textBod, phoneNum, twiml, req, res, message, currUser);
    } else {
        search(textBod, phoneNum, twiml, req, res, message);
    }
});

function isAction(textBod) {
    return textBod == actions.play.text || textBod == actions.pause.text || textBod == actions.next.text;
}

function performAction(twiml, res, textBod) {
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

function makeSelection(textBod, phoneNum, twiml, req, res, message, currUser) {
    let songs = currUser.results;
    if (textBod == "!") {
        message = "Oh shit you don canceled it!";
        delete req.session.users[phoneNum];
    } else if (textBod == ">" || textBod == "<") {
        let add = (textBod == ">") ? 1 : -1;
        if ((currUser.page + add) * 3 >= songs.length) {
            message = "Already on the last page";
        } else if (currUser.page + add < 0) {
            message = "Already on the first page";
        } else {
            currUser.page += add;
            message = buildMessageFromPage(currUser.page, songs, message);
        }
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
    req.session.users[phoneNum] = {
        "results": [],
        "page": 0
    };
    mopidy.searchMopidy(textBod).then(function (results) {
        let tracks = results[0].tracks;
        if (tracks) {
            message = "Respond with song choice, '>' for more results, '<' for previous results, or '!' to cancel\n";
            //put 15 of the results in the cookie
            let limit = tracks.length < 15 ? tracks.length : 15;
            for (var i = 0; i < limit; i++) {

                req.session.users[phoneNum].results.push({
                    "uri": tracks[i].uri,
                    "title": tracks[i].name,
                    "artist": tracks[i].artists[0].name
                });
            }
            //pick out the 3 to return
            message = buildMessageFromPage(0, req.session.users[phoneNum].results, message);
        } else {
            message = "Search had 0 results, don't be such a hipster";
            delete req.session.users[phoneNum];
        }
        sendResponse(twiml, res, message);
    });
}

function buildMessageFromPage(page, tracks, message) {
    let currIndex = page * 3;
    let limit = tracks.length < currIndex + 3 ? tracks.length : currIndex + 3;
    for (var i = currIndex; i < limit; i++) {
        message += i + ": " + tracks[i].title + " - " + tracks[i].artist + "\n";
    }
    return message;
}

app.listen(3000, function () {
    console.log('Listenting on port 3000');
})