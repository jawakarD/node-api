/* helpers for vaiours Tasks
 *
 *
 8
 */


//Dependencies
var crypto   = require('crypto');
var config = require('./config');
var querystring = require('querystring');
var https = require('https');
const path = require('path');
const fs = require('fs');
//Containers for all helpers
var helpers = {};

 //Create a SHA256 hashPassword

 helpers.hash = function (str) {
     if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
        return hash;
     }else{
         return str;
     }
 };

//parse a JSON string to object in all cases
 helpers.parsedJsonToObjectBuffer = function(str) {
     try{
         let obj = JSON.parse(str);
         return obj;
     }catch(e){
         return {};
     }
 };

//create a string of random alpha numerical values

helpers.createRandomString = function (strLength) {
    strLength  = typeof(strLength) == 'number' && strLength > 0 ? strLength  : false;

    if(strLength){
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz123456789';
        var str= '';
        for( var i =1; i<=strLength; i++){
            var randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str+=randomChar;
        }
        return str;
    }else{
        return false;
    }
};

helpers.sendTwilioSms = function (phone,msg,callback) {
    //Validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' & msg.trim().length >0 && msg.trim().length <= 1600 ? msg.trim() : false;
    if(phone && msg){
        //configure the req payload
        var payload ={
            'From' : config.twilio.fromPhone,
            'To' : '+91'+phone,
            'Body' : msg
        };

        //Stringyfy the payload
        var stringPayload = querystring.stringify(payload);

        //Cofigure the request details
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' :Buffer.byteLength(stringPayload)
            }
        };

        //Instantioate the req object
        var req = https.request(requestDetails,function(res) {
            var statusCode = res.statusCode;

            if(statusCode == 200 || statusCode == 201){
                callback(false);
            }else{
                callback('Status code returned '+statusCode);
            }
        });

        //Bnd to the error event
        req.on('error',function (e) {
            callback(e);
        });

        //Ad the payload
        req.write(stringPayload);

        //Ent the request
        req.end();

    }else{
        callback('given credentials were invalid or missing');
    }
};

helpers.getTemplate = function(templateName,data,callback){
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof(data) == 'object' && data !== null ? data : {};
  if(templateName){
    var templatesDir = path.join(__dirname,'/../templates/');
    fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err,str){
      if(!err && str && str.length > 0){
        // Do interpolation on the string
        var finalString = helpers.interpolate(str,data);
        callback(false,finalString);
      } else {
        callback('No template could be found');
      }
    });
  } else {
    callback('A valid template name was not specified');
  }
};

// Add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = (str,data,callback) => {
     data = typeof(data) == 'object' && data !== null ? data : {};
     str = typeof(str) == 'string' && str.length ? str : '';

     //get the headers
     helpers.getTemplate('_header',data,(err,headerString)=>{
        if(!err && headerString){

            //get the footer template
            helpers.getTemplate('_footer',data,(err, footerString)=>{
                if(!err && footerString){
                    var fullString =headerString+str+footerString;
                    callback(false,fullString);
                }else {
                    callback('could not get the footer');
                }
            });
        } else {
            callback('COuld not find header template');
        }
     });
};

helpers.interpolate = (str,data)=>{
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};


    //Add the templateGlobal to the data object
    for (var keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.'+keyName] = config.templateGlobals[keyName];
        }
    }

    //for data to add the variables in the web page
    for (var key in data) {
        if (data.hasOwnProperty(key) && typeof(data[key] === 'string')) {
            var replace = data[key];
            var find = '{'+key+'}';
            str = str.replace(find,replace);
        }
    }
    return str;
};




helpers.getStaticAsset = (fileName,callback)=>{
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;

    if(fileName){
        // path.join(__dirname,'/../.data/');
        var publicDir = path.join(__dirname,'/../public/');
        fs.readFile(publicDir+fileName,(err,data)=>{
            if(!err && data){
                callback(false,data);
            }else {
                callback('no data found');
            }
        });
    }else {
        callback('need a valid fileName');
    }
};








 //Exporting the Library

 module.exports = helpers;
