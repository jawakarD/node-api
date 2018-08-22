/*
 * All Servers related tasks
 *
 */


var http = require('http');
var https = require('https');
var url = require('url');
var config = require('./config');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
// var _data = require('./lib/data.js');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');
var util = require('util');
// var debug = util.debuglog('server');

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
};

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

        choosenHandler = trimmedPath.indexOf('public/') > -1  ? handlers.public : choosenHandler;

        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parsedJsonToObjectBuffer(buffer)
        };

        choosenHandler(data,function(statusCode,payload,contentType) {

            //Determine the type of request fallback to json
            contentType = typeof(contentType) == 'string' ? contentType : 'json';

            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            var payloadString = '';

            //setting content sepecific to html request
            if(contentType=='html'){
                payloadString =  typeof(payload) == 'string'? payload : '';
                res.setHeader('Content-Type' , 'text/html');
            }
            //setting content sepecific to css request
            if(contentType=='css'){
                payloadString =  typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type' , 'text/css');
            }
            //setting content sepecific to favicon request
            if(contentType=='favicon'){
                payloadString =  typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type' , 'image/x-icon');
            }
            //setting content sepecific to png request
            if(contentType=='png'){
                payloadString =  typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type' , 'image/png');
            }
            //setting content sepecific to jpg request
            if(contentType=='jpg'){
                payloadString =  typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type' , 'image/jpg');
            }
            //setting content sepecific to plain request
            if(contentType=='plain'){
                payloadString =  typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type' , 'text/plain');
            }

            //setting content sepecific to json requesr
            if(contentType=='json'){
                payload = typeof(payload) == 'object' ? payload : {};
                payloadString = JSON.stringify(payload);
                res.setHeader('Content-Type' , 'application/json');
            }

            //returning that are common to all functions
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log(payloadString, statusCode);
        });

    });
};

server.router = {
    '' : handlers.index,
    'account/create' : handlers.accountCreate,
    'account/edit' : handlers.accountEdit,
    'account/deleted' : handlers.deleted,
    'session/create' : handlers.sessionCreate,
    'session/deleted' : handlers.deleted,
    'checks/all' : handlers.checkList,
    'checks/create' : handlers.checksCreate,
    'checks/edit' : handlers.checksEdit,
    'ping' : handlers.ping,
    'api/hello' : handlers.hello,
    'api/users' : handlers.users,
    'api/tokens' : handlers.tokens,
    'api/checks' : handlers.checks,
    'public' : handlers.public,
    'favicon' : handlers.favicon
};

server.init = function() {

    //Starting to http server
    server.httpServer.listen(config.httpPort,function() {
        console.log('\x1b[36m%s\x1b[0m', 'The HTTP server is listening on port  '+config.httpPort);
    });

    //Strarting the https server
    server.httpsServer.listen(config.httpsPort,function() {
        console.log('\x1b[36m%s\x1b[0m', 'The HTTPS server is listening on port '+config.httpsPort);
    });
};

//Exporting the Server
module.exports=server;
