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

exports.addToQueue = function (uri, callback) {
    mopidy.tracklist.add(null, null, uri, null).then(function(data){
        console.log(data);
    })
}