/*
 * All Wrorker related tasks
 *
 */

// var http = require('http');
// var https = require('https')
// var url = require('url');
// var config = require('./config');
// var fs = require('fs');
// var StringDecoder = require('string_decoder').StringDecoder;
// var handlers = require('./handlers');
// var helpers = require('./helpers');
// var _data = require('./data');
// var path = require('path')


//Dependencies
var path = require('path');
var fs = require('fs');
var _data = require('./data');
var https = require('https');
var http = require('http');
var helpers = require('./helpers');
var url = require('url');
var _logs = require('./logs');
var util = require('util');
var debug = util.debuglog('workers');


//Instantiate the worker object
var workers = {};


//Lookup all the checks get their object and send their data
workers.gatherAllChecks = function () {
  //Get all the checks
  _data.list('checks',function(err,checks) {
    if(!err && checks && checks.length > 0){
      checks.forEach(function(check) {
        //Read every check data'
        _data.read('checks',check,function(err,originalCheckData) {
          if(!err && originalCheckData){
            //Pass the gathered object to the workers validator tpp validate
            workers.validateCheckData(originalCheckData);
          }else{
            debug('Error readig one of the check data',err);
          }
        });
      });
    }else{
      debug('Could not find any checks to process');
    }
  });
};

workers.validateCheckData=function (originalCheckData) {
  originalCheckData = typeof(origanalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
  originalCheckData.phone = typeof(originalCheckData.phone) == 'string' && originalCheckData.phone.trim().length == 10 ? originalCheckData.phone.trim() : false;
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http','https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0  ? originalCheckData.url.trim() : false;
  originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post','get','put','delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method: false;
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
  originalCheckData.timeOutSeconds = typeof(originalCheckData.timeOutSeconds) == 'number' && originalCheckData.timeOutSeconds % 1 === 0 && originalCheckData.timeOutSeconds >= 1 && originalCheckData.timeOutSeconds <= 5 ? originalCheckData.timeOutSeconds : false;

    //set keys that may not be already set (if worker checking this for te first time)
  originalCheckData.state = typeof(originalCheckData.state) == 'string'  && ['up','down'].indexOf(originalCheckData.state) >-1 ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number'  && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : 'down';

  if(originalCheckData.id  &&
  originalCheckData.phone  &&
  originalCheckData.protocol  &&
  originalCheckData.url  &&
  originalCheckData.method  &&
  originalCheckData.successCodes  &&
  originalCheckData.timeOutSeconds){
    workers.performCheck(originalCheckData);
  }else {
    debug({'Error':'Missing req fields'});
  }
};

//Perform the check and send the result of the checkes data to the next step in the process

workers.performCheck = function(originalCheckData) {
  //Prepere the initial check outcome before check
  var checkOutcome = {
    'error' : false,
    'responseCode' : false
  };

  //mark the outcome has not been sent yet
  var outcomeSent = false;

  //get hostname and path from the origanalCheckData
  var parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url);
  var hostName = parsedUrl.hostname;
  var path = parsedUrl.path;

  //Construct the sending request
  var requestDetails={
    'protocal' : originalCheckData.protocol,
    'hostname' : hostName,
    'method' : originalCheckData.method,
    'path' : path,
    'timeout' : originalCheckData.timeOutSeconds * 1000
  };

  //Instantiating the request object (using http or https)
  var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
  var req = _moduleToUse.request(requestDetails,function (res) {
    //grab the status
    var status = res.statusCode;

    //update check outcome and then pass
    checkOutcome.responseCode = status;
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData,checkOutcome);
      outcomeSent=true;
    }
  });


// Bind to the error event
  req.on('error',function(e) {
    checkOutcome.error = {'error': true, value: e};
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData,checkOutcome);
      outcomeSent=true;
    }
  });

  // Bind to the timeout event
  req.on('timeout',function(){
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {'error' : true, 'value' : 'timeout'};
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData,checkOutcome);
      outcomeSent = true;
    }
  });

  req.end();
};

workers.processCheckOutcome=function (originalCheckData,checkOutcome) {
  //Decide if a check is up or down
  var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

  //Checks if alert is wanted
  var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;
  var newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  //Logging the checks
  var timeOfCheck = Date.now();
  workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

  _data.update('checks',newCheckData.id,newCheckData,function (err) {
    if(!err){
      if(alertWarranted){
        workers.alertUserToStatusChange(newCheckData);
      }else {
        debug('check outcome has not changed so, no alert needed');
      }
    }else {
      debug('Error updating one of the checks');
    }
  });
 };


 //Alert user if there is s change in their check
workers.alertUserToStatusChange = function(newCheckData) {
  var msg = 'Alert : Your check for '+newCheckData.method+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
  helpers.sendTwilioSms(newCheckData.phone,msg,function(err) {
    if(!err){
      debug("Success: User was alerted to a status change in their check, via sms: ",msg);
    }else {
      debug('Error : Could not send alert to the user after the state change in their check',err);
    }
  });
};


//Send the check data to log file
//Send check data to a log file
workers.log = function(originalCheckData,checkOutcome,state,alertWarranted,timeOfCheck){
  // Form the log data
  var logData = {
    'check' : originalCheckData,
    'outcome' : checkOutcome,
    'state' : state,
    'alert' : alertWarranted,
    'time' : timeOfCheck
  };

  // Convert the data to a string
  var logString = JSON.stringify(logData);

  // Determine the name of the log file
  var logFileName = originalCheckData.id;

  // Append the log string to the file
  _logs.append(logFileName,logString,function(err){
    if(!err){
      debug("Logging to file succeeded");
    } else {
      debug(err);
    }
  });

};


workers.loop = function () {
  setInterval(function () {
    workers.gatherAllChecks();
  },1000*5);
};



//To rotate(Compree) logs every 1 hr
workers.rotateLogsLoop = function() {
  setInterval(function () {
    workers.rotateLogs();
  }, 1000 * 60 *60*24);
}

//To Rotate(Compress) the logs to efficency
workers.rotateLogs = function () {
  //list the logs and then compres it;
  //list ================
  _logs.list(false,function(err,logs) {
      if(!err && logs && logs.length >0 ){
        logs.forEach(function (logName) {
          //Compress ============== the data  to the different file
          debug(logName);
          var logId = logName.replace('.log','');
          debug(logId);
          var newField  = logId+Date.now();
          _logs.compress(logId,newField,function (err) {
            if (!err) {
              //Delete(Truncate) ================ the data in the existng file
              _logs.truncate(logId,function (err) {
                if (!err) {
                  debug('Compressing the file is successful');
                } else {
                  debug(err);
                }
              });
            } else {
              debug(err);
            }
          });
        });
      }else {
        debug('Could not list the logNames');
      }
  });
};

//Init the workers script
workers.init = function () {

  //Excecute al the checks immediately
  workers.gatherAllChecks();

  //loopthrough the checks later
  workers.loop();

  //Rotating logs
  workers.rotateLogs();

  //fnction to loop rotate logs every 1hr
  workers.rotateLogsLoop();
};







//Export the workers module
module.exports = workers;
