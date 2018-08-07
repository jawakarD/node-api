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
        for( i =1; i<=strLength; i++){
            var randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str+=randomChar;
        }
        return str;
    }else{
        return false;
    }
}

helpers.sendTwilioSms = function (phone,msg,callback) {
    //Validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' & msg.trim().length >0 && msg.trim().length <= 1600 ? msg.trim() : false;
    if(phone && msg){
        //configure the req payload
        var payload ={
            'From' : config.twilio.fromPhone,
            'To' : "+91"+phone,
            'Body' : msg
        }

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
                callback('Status code returned '+statusCode)
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
}



 //Exporting the Library

 module.exports = helpers;
