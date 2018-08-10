/*
 * Primary application file for API
 *
 */
//Dependencies
var servers = require('./lib/servers');
var workers = require('./lib/workers');

//App Declaration
var app ={};


app.init = function () {

    //Start the app
    servers.init();

    //Start the workers
    workers.init();

};

app.init();





//Export the app
module.exports = app;
