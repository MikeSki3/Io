'use strict'

var request = require('request');

let mopidyHttpEnd = 'http://localhost:6680/mopidy/rpc';

exports.searchMopidy = function (param, callback) {
    request({
            uri: mopidyHttpEnd,
            method: 'POST',
            'content-type': 'application/json',
            body: {
                "method": "core.library.search",
                "jsonrpc": "2.0",
                "params": {
                    "query": {
                        "any": [param]
                },
                "uris": ["spotify:"]
                },
                "id": 1
            },
            json: true
        },

        function (error, response, body) {
            if(error){
                console.log('searching failed');
            }
            if(callback)
                callback(body);
        });
}

exports.addToQueue = function(uri, callback){
    request({
        uri: mopidyHttpEnd,
        method: 'POST',
        'content-type': 'application/json',
            body: {
                "method": "core.tracklist.add",
                "jsonrpc": "2.0",
                "params": {
                    "uri": uri
                },
                "id": 1
            },
            json: true
        },

        function (error, response, body) {
            if(error){
                console.log('add to queue failed');
            }
            if(callback)
                callback(body);
        });
}