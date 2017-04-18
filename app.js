'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var mopidy = require('./mopidyApi/api.js');

var config = require('./config/config');
var twilio = require('twilio');

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: config.SESSION_SECRET}));

app.post('/sms', function(req, res) {
    console.log(req.body.Body);
    let textBod = req.body.Body;
    let phoneNum = req.body.From;

    if(!req.session.users){
        req.session.users = {};
    }
    var songs = req.session.users[phoneNum];
    
    var twiml = new twilio.TwimlResponse();
    var message = "";
    if(songs){
        if(!isNaN(textBod) && textBod >= 0 && textBod < songs.length){
            message = "Queueing up: " + songs[textBod].title + " - " + songs[textBod].artist;
            mopidy.addToQueue(songs[textBod].uri);
            delete req.session.users[phoneNum];
        } else {
            message = "Don't be an ass, just make a song choice";
        }
        sendResponse(twiml, res, message);
    } else {
        req.session.users[phoneNum] = [];
        mopidy.searchMopidy(req.body.Body).then(function(results){
            message = "Respond with song choice\n";
            let tracks = results[0].tracks;
            let limit = tracks.length < 3 ? tracks.length : 3;
            for(var i = 0; i < limit; i++){
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
});

function sendResponse(twiml, res, message){
    twiml.message(message);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
}

// function searchResult(results, phoneNum){

//     mopidy.addToQueue(results[0].tracks[0].uri, function(response){
//         console.log(response);
//     });
//     console.log("Queueing up: " + results[0].tracks[0].name + " - " + results[0].tracks[0].artists[0].name);
// }

app.listen(3000, function(){
    console.log('Listenting on port 3000');
})