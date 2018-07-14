var http = require('http');
var https = require('https')
var url = require('url');
var config = require('./config');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;

//Instantiating the http server
var httpServer = http.createServer(function(req,res) {
    unifiedServer(req,res);
});

//Starting to http server
httpServer.listen(config.httpPort,function() {
    console.log('The HTTP server is listening on port  '+config.httpPort);
});

//Instatiating the https server
var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
}

var httpsServer = https.createServer(httpsServerOptions,function(req,res) {
    unifiedServer(req,res);
});

//Strarting the https server
httpsServer.listen(config.httpsPort,function() {
    console.log('The HTTPS server is listening on port '+config.httpsPort);
});

//  unifiedServer for all servers to connect;
var unifiedServer = function (req,res) {

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

        var choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        }

        choosenHandler(data,function(statusCode,payload) {

            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            payload = typeof(payload) == 'object' ? payload : {};

            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type' , 'application/json');

            res.writeHead(statusCode);

            res.end(payloadString);

            console.log(trimmedPath, statusCode);
        });

    });
};

var handlers  = {};

handlers.hello = function(data,callback) {
    callback(200,{"wecome":"you most"});
};

handlers.notFound= function (data,callback) {
    callback(404);
};

var router = {
    'hello' : handlers.hello
};
