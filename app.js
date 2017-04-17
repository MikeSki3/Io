var express = require('express')
var bodyParser = require('body-parser')
var session = require('express-session');
var mopidy = require('./mopidyApi/api.js')

var app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(session({secret: process.env.SESSION_SECRET}))

app.post('/sms', function(req, res) {
    console.log(req.body.Body);
    mopidy.searchMopidy(req.body.Body, searchResult)
    res.sendStatus(200)
});

function searchResult(results){
    mopidy.addToQueue(results[0].tracks[0].uri, function(response){
        console.log(response);
    });
    console.log("Queueing up: " + results[0].tracks[0].name + " - " + results[0].tracks[0].artists[0].name);
}

app.listen(3000, function(){
    console.log('Listenting on port 3000');
})