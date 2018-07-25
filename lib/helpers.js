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

 helpers.parsedJsonToObjectBuffer = function(str) {
     try{
         let obj = JSON.parse(str);
         return obj;
     }catch(e){
         return {};
     }
 };







 //Exporting the Library

 module.exports = helpers;
