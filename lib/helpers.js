/* helpers for vaiours Tasks
 *
 *
 8
 */


//Dependencies
var crypto   = require('crypto');
var config = require('./config');

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







 //Exporting the Library

 module.exports = helpers;
