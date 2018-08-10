/*
 * All Servers related tasks
 *
 */


var http = require('http');
var https = require('https')
var url = require('url');
var config = require('./config');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
// var _data = require('./lib/data.js');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');

//Inatantiating the server Object module
var server = {};


//----------------------
//Instantiating the http server
server.httpServer = http.createServer(function(req,res) {
    server.unifiedServer(req,res);
});

//Instatiating the https server
server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
}

server.httpsServer = https.createServer(server.httpsServerOptions,function(req,res) {
    server.unifiedServer(req,res);
});


//  unifiedServer for all servers to connect;
server.unifiedServer = function (req,res) {

    var parsedUrl = url.parse(req.url,true);

    var path = parsedUrl.pathname;

    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    var queryStringObject = parsedUrl.query;

    var method = req.method.toLowerCase();

    var headers = req.headers;

    var decoder = new StringDecoder('utf-8');
    var buffer ='';
    req.on('data',function(data) {
        buffer += decoder.write(data);
    });

    req.on('end',function() {

        buffer += decoder.end();

        var choosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parsedJsonToObjectBuffer(buffer)
        }

        choosenHandler(data,function(statusCode,payload) {

            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            payload = typeof(payload) == 'object' ? payload : {};

            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type' , 'application/json');

            res.writeHead(statusCode);

            res.end(payloadString);

            console.log(payloadString, statusCode);
        });

    });
};

server.router = {
    'hello' : handlers.hello,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
};

server.init = function() {

    //Starting to http server
    server.httpServer.listen(config.httpPort,function() {
        console.log('The HTTP server is listening on port  '+config.httpPort);
    });

    //Strarting the https server
    server.httpsServer.listen(config.httpsPort,function() {
        console.log('The HTTPS server is listening on port '+config.httpsPort);
    });
}

//Exporting the Server
module.exports=server;
