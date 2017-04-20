'use strict'

var request = require('request');
var Mopidy = require('mopidy');

var mopidy = new Mopidy({
    webSocketUrl: "ws://localhost:6680/mopidy/ws"
});

let mopidyHttpEnd = 'http://localhost:6680/mopidy/rpc';

exports.searchMopidy = function (param, callback, phoneNum) {
    return mopidy.library.search({
        "any": [param]}, ["spotify:"]);
}

exports.addToQueue = function (uri, autoplay) {
    mopidy.tracklist.add(null, null, uri, null).then(function(data){
        console.log("Queueing up: " + data[0].track.name + " - " + data[0].track.artists[0].name);
        let tlid = data[0];
        if(autoplay){
            mopidy.playback.getState().then(function(data){
                console.log(data);
                if(data === 'stopped'){
                    mopidy.playback.play(tlid).then(function(data){
                        console.log("Playing...");
                    });
                }
                // console.log(data);
            });
        }
    });
}

exports.playNextTrack = function(){
    mopidy.playback.next().then(function(data){
        console.log(data);
        mopidy.playback.play().then(function(data){
            console.log("Next...");
        });
    });
}

exports.pauseQueue = function(){
    mopidy.playback.pause().then(function(data){
        console.log("Pausing...");
    });
}

exports.playQueue = function(){
    mopidy.playback.play().then(function(data){
        console.log("Playing...");
    })
}