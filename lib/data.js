/*
 * Library for storing and editing data
 *
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for module (to be exported)
var lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../.data/');

// Write data to a file
lib.create = function(dir,file,data,callback){
  // Open the file for writing
  fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
    if(!err && fileDescriptor){
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData,function(err){
        if(!err){
          fs.close(fileDescriptor,function(err){
            if(!err){
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, it may already exist');
    }
  });

};

lib.read = function(dir,file,callback) {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf-8',function (err,data) {
        if(!err && data){
            var parsedData = helpers.parsedJsonToObjectBuffer(data);
            callback(false,parsedData)
        }else{
            callback(err,data);
        }
    });
};


lib.update = function (dir,file,data,callback) {
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+',function (err,fileDescriptor) {
        if(!err && fileDescriptor){
            var stringData = JSON.stringify(data);
            fs.truncate(fileDescriptor,function (err) {
                if(!err){
                    fs.writeFile(fileDescriptor,stringData,function (err) {
                        if(!err){
                            fs.close(fileDescriptor,function (err) {
                                if(!err){
                                    callback(false);
                                }else{
                                    callback('could not close the file');
                                }
                            });
                        }else{
                            callback('could not write data to the opened file');
                        }
                    });
                }else{
                    callback('could not delete');
                }
            });
        }else{
            callback(err);
        }
    });
};

// Delete a file
lib.delete = function(dir,file,callback){

  // Unlink the file from the filesystem
  fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err){
      if(!err){
          callback(err);
      }else{
          callback('Error seleting file')
      }
  });

};



lib.list = function(dir,callback){
    fs.readdir(lib.baseDir+dir+'/',function (err,data) {
        if(!err && data && data.length>0){
            var trimmedFileNames  = [];
            data.forEach(function(fileName) {
                trimmedFileNames.push(fileName.replace('.json',''));
            });
            callback(err,trimmedFileNames);
        }else{
            callback(err,data);
        }
    });
};

















module.exports = lib;
