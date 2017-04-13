'use strict'

var request = require('request');

exports.searchMopidy = function (param, callback) {
    let options = {
        host: 'localhost',
        path: 'mopidy/rpc',
        port: '6680',
        method: 'POST'
    }

    let mopidyHttpEnd = 'http://localhost:6680/mopidy/rpc';
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
                console.log('fudge...');
            }

            callback(body);
        });
}