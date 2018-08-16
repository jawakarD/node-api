/*
 * Library to log checks to the files
 *
 */


//Dependencies
 const fs = require('fs');
 const path = require('path');
 const zlib = require('zlib');

 //Container for the module
 var lib = {};

 // Base directory of logs folder
 lib.baseDir = path.join(__dirname,'/../.log/');

 // Append a string to a file. Create the file if it does not exist
 lib.append = function(file,str,callback){
   // Open the file for appending
   fs.open(lib.baseDir+file+'.log', 'a', function(err, fileDescriptor){
     if(!err && fileDescriptor){
       // Append to file and close it
       fs.appendFile(fileDescriptor, str+'\n',function(err){
         if(!err){
           fs.close(fileDescriptor,function(err){
             if(!err){
               callback(false);
             } else {
               callback('Error closing file that was being appended');
             }
           });
         } else {
           callback('Error appending to file');
         }
       });
     } else {
       callback(err);
     }
   });
 };


lib.list = function (includeCompressedLogs, callback) {
  fs.readdir(lib.baseDir,function (err,data) {
    if (!err && data && data.length>0) {
      var trimmedFileNames = [];
      data.forEach(function (fileName) {

        //Add the .log files
        if (fileName.indexOf('.log')>-1 ) {
          trimmedFileNames.push(fileName.replace('.log',''))
        }

        //add the commpressed files also
        if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs){
          trimmedFileNames.push(fileName.replace('.gz.b64',''))
        }
      });
      callback(false,trimmedFileNames);
    } else {
      callback(err,data);
    }
  });
}

lib.compress= function(logId, newField, callback) {
  //var sourseFile
  var sourceFile = logId+'.log';
  var destFile= newField+'.gz.b64';

  //Read the data in source
  fs.readFile(lib.baseDir+sourceFile,'utf-8',function(err, inputString) {
    if(!err && inputString){

      //Compress the data using the glib library in zlib
      zlib.gzip(inputString,function (err, buffer) {
        if (!err && buffer) {

          //Send the compressed data to the other file
          fs.open(lib.baseDir+destFile,'wx',function(err, fileDescriptor) {
            if(!err && fileDescriptor){

              //Write to the distination file
              fs.write(fileDescriptor,buffer.toString('base64'),function(err) {
                if(!err){
                  fs.close(fileDescriptor,function (err) {
                    if(!err){
                      callback(false);
                    }else {
                      callback(err);
                    }
                  })
                }else{
                  callback(err);
                }
              });
            }else {
              callback(err);
            }
          });
        } else {
          callback(err);
        }
      });
    }else {
      callback(err);
    }
  });
}

//Decompress the content of the .gz.b64 file into a string variable
lib.decompress=function (fileId,callback) {
  var fileName = fileId+'.gz.b64';
  fs.readFile(lib.baseDir+fileName,'utf-8',function (err,str) {
    if(!err && str){

      //Decompress the data string
      var inputBuffer = Buffer.from(str,'base64');
      zlib.unzip(inputBuffer,function (err,outputBuffer) {
        if(!err && outputBuffer){

          //return the callback eith decompressed string
          var decompressedString = outputBuffer.toString();
          callback(false,decompressedString);
        }else {
          callback(err);
        }
      });
    }else {
      callback(err);
    }
  });
};


lib.truncate = function (logId,callback) {
  fs.truncate(lib.baseDir+logId+'.log',0,function(err) {
    if(!err){
      callback(false);
    }else{
      callback(err);
    }
  });
};













//Exort the filesystem
module.exports = lib;
