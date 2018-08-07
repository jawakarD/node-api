/*
 *
 * data handler for users service
 *
 */


//Dependencies=======================
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

//Defining Handlers===================
var handlers  = {};

handlers.hello = (data,callback) => callback(200,{"wecome":"you most"});

handlers.notFound= (data,callback) => callback(404);

var   MissingReqField = {
    'Error' : 'Missing required fields'
}


// ========== Users============ //

handlers.users = function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) >-1){
        handlers._users[data.method](data,callback);
    }else{
        callback(405);
    }
}


handlers._users = {};


//==========Users-post==============//
handlers._users.post = function (data,callback) {

    // chack for all required fields=============
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.length > 0 ? data.payload.firstName.trim(): false ;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.length > 0 ? data.payload.lastName.trim() : false ;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone.trim() : false ;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.length > 0 ? data.payload.password.trim() : false ;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ?  true : false ;

    if(firstName && lastName && phone && password && tosAgreement){
        _data.read('users',phone,function (err,data) {
            if(err){
                // Hash the Password
                var hashedPassword = helpers.hash(password);
                if(hashedPassword){
                    //================Create user=====================
                    var userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'password' : hashedPassword,
                        'tosAgreement' : true
                    }

                    //===========store the user===========

                    _data.create('users',phone,userObject,function (err) {
                        if(!err){
                            callback(200);
                        }else{
                            console.log(err);
                            callback(500, {'Error' : 'Could not create a new User'});
                        }
                    });
                }else{
                    callback(500,{'Error' : hashedPassword});
                }
            }else{
                callback(400,{ 'Error' : 'A user with phone number already exixts'})
            }
        });
    }else{
        callback(400,MissingReqField);
    }
};

//==========Users-get==============//

//--- required-> phone
//---Optional ->  nul

handlers._users.get = function (data,callback) {
    //check for valid phone
    var phone = typeof(data.queryStringObject.phone) =='string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        //Get a token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        //Check for valid token
        handlers._tokens.verifyToken(token,phone,function (tokenIsValid) {
            if(tokenIsValid){
                //Look for user
                _data.read('users',phone,function (err,data) {
                    if(!err && data){
                        //Remove hashwdpassword;
                        delete data.password;
                        callback(200,data);
                    }else {
                        callback(404);
                    }
                });
            }else{
                callback(403 , {'Error' : 'token is missing in the header fields or token is invlaid'});
            }
        });
    }else {
        callback(400,MissingReqField)
    }
};

//==========Users-put==============//
handlers._users.put = function (data,callback) {

    //required -> phone
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone.trim() : false ;

    //Optional firatName...lastName...password...tosAgreement... but required atleast one field
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.length > 0 ? data.payload.lastName.trim() : false ;
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.length > 0 ? data.payload.firstName.trim(): false ;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.length > 0 ? data.payload.password.trim() : false ;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ?  true : false ;
    if(phone){
        //Get a token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        //Check for valid token
        handlers._tokens.verifyToken(token,phone,function (tokenIsValid) {
            if(tokenIsValid){
                if(lastName || firstName|| password){
                    // Look for the users
                    _data.read('users',phone,function (err,userData) {
                        if(!err && userData){
                            if(firstName){
                                userData.firstName = firstName;
                            }
                            if(lastName){
                                userData.lastName = lastName;
                            }
                            if(password){
                                userData.password = password;
                            }
                        //Store the new Data to Users
                        _data.update('users',phone,userData,function (err) {
                            if(!err){
                                callback(200);
                            }else{
                                console.log(err);
                                callback(500,{'Error':'Could not update'})
                            }
                        });
                    }else {
                        callback(400,{'Error':'specified user does not exist'});
                    }
                    });
                }else{
                    callback(400,{'Error':'Missing fields to update'});
                }
            }else{
                callback(403 , {'Error' : 'token is missing in the header fields or token is invlaid'});
            }
        });
    }else{
        callback(400,MissingReqField);
    }
}

//==========Users-delete==============//
//required - > phone
handlers._users.delete = function (data,callback) {
    //Check for phoneNumber
    var phone = typeof(data.queryStringObject.phone) =='string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        //Get a token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        //Check for valid token
        handlers._tokens.verifyToken(token,phone,function (tokenIsValid) {
            if(tokenIsValid){
                _data.read('users',phone,function (err,userData) {
                    if(!err && userData){
                        _data.delete('users',phone,function (err) {
                            if(!err){
                                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                var checksToDelete = userChecks.length;
                                if(checksToDelete>0){
                                    var checksDeleted =0;
                                    var deletionError =false;
                                    //Loop through checks to delete
                                    userChecks.forEach(function(checkId) {
                                        _data.delete('checks',checkId,function(err) {
                                            if(err){
                                                deletionError = true;
                                            }
                                            checksDeleted++;
                                            if(checksDeleted==checksToDelete){
                                                if(!deletionError){
                                                    callback(200);
                                                }else{
                                                    callback(500,{'Error':'Could not delete all the checks rerlated to the user to be deleted there may be checks still in the system'});
                                                }
                                            }
                                        });
                                    });
                                }else{
                                    callback(200,{'Error':userChecks});
                                }
                            }else{
                                callback(500,{'Error' : 'Cound not delete'});
                            }
                        });
                    }else {
                        callback(400,{'Error' : 'User not found'});
                    }
                });
            }else{
                callback(403 , {'Error' : 'token is missing in the header fields or token is invlaid'});
            }
        });
    }else {
        callback(400,MissingReqField)
    }
};



// ========== Tokens============ //

handlers.tokens = function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) >-1){
        handlers._tokens[data.method](data,callback);
    }else{
        callback(405);
    }
};

//Contaior  for all methods====================

handlers._tokens ={};

//Tokens post============
handlers._tokens.post  = function(data,callback) {
    var password = typeof(data.payload.password) == 'string' && data.payload.password.length > 0 ? data.payload.password.trim() : false ;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone.trim() : false ;
    if(phone && password){
        //Read the user data to match the given users
        _data.read('users',phone,function (err,userData) {
            if(!err && userData){
                //Hash ad compare the passwords
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.password){
                    //if valid create a token in random name , Set the token to expire in 1 hour
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() +  1000 * 60 * 60;
                    var tokenObject  ={
                        'phone' : phone,
                        'id' : tokenId,
                        'expires' : expires
                    };

                    //after creating tokens store tokens in a directory tokens

                    _data.create('tokens',tokenId,tokenObject,function (err) {
                        if(!err){
                            callback(200,tokenObject);
                        }else{
                            callback(500,{'error': err});
                        }
                    });
                }else{
                    callback(400, {'Error' : 'Sorry! Wrong Password'});
                }
            }else{
                callback(400,{'Error' : 'Could not find the userData specified'});
            }
        });
    }else{
        callback(400,MissingReqField);
    }
};

//Tokens get============
handlers._tokens.get = function (data,callback) {
    //check for valid phone
    var id = typeof(data.queryStringObject.id) =='string' && data.queryStringObject.id.trim().length >0 ? data.queryStringObject.id.trim() : false;
    if(id){
        _data.read('tokens',id,function (err,tokenData) {
            if(!err && tokenData){
                //Remove hashwdpassword;
                callback(200,tokenData);
            }else {
                callback(404);
            }
        });
    }else {
        callback(400,{'error': id})
    }

};

//Tokens put============
//Req--> id, extend
//Optional ->
handlers._tokens.put = function (data,callback) {

    var id = typeof(data.payload.id) == 'string' && data.payload.id.length == 20 ? data.payload.id.trim() : false ;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false ;
    if(id && extend){
        //Look up in the token
        _data.read('tokens',id,function(err, tokenData){
            if(!err && tokenData){
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    _data.update('tokens',id,tokenData,function(err) {
                        if(!err){
                            callback(200);
                        }else{
                            callback(500,{'Error':'Could not update the user\'s data'});
                        }
                    });
                }else{
                    callback(400,{'Error':'Token is already expired'});
                }
            }else{
                callback(400,{'Error' : 'Cannot find the specified user token'});
            }
        });

    }else{
        callback(400,MissingReqField);
    }
};

//Tokens delete============
handlers._tokens.delete = function (data,callback) {
    var id = typeof(data.queryStringObject.id) =='string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
        _data.read('tokens',id,function (err,data) {
            if(!err && data){
                _data.delete('tokens',id,function (err) {
                    if(!err){
                        callback(200);
                    }else{
                        callback(500,{'Error' : 'Cound not delete'});
                    }
                });
            }else {
                callback(400,{'Error' : 'specified token not found'});
            }
        });
    }else {
        callback(400,MissingReqField)
    }
};



handlers._tokens.verifyToken=function (id,phone,callback) {
    _data.read('tokens',id,function(err,tokenData) {
        if(!err && tokenData){
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            }else{
                callback(false);
            }
        }else{
            callback(false);
        }
    });
};

// Create checks handler
handlers.checks = function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) >-1){
        handlers._checks[data.method](data,callback);
    }else{
        callback(405);
    }
};

//Container for al checks
handlers._checks = {};

//check--post
//Required -> protocal/url/method/successCode/timeOutSeconds
//Option data -> none
handlers._checks.post=function (data,callback) {
    var protocol = typeof(data.payload.protocol) == 'string' && ['http','https'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false ;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.length > 0 ? data.payload.url.trim() : false ;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false ;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false ;
    var timeOutSeconds = typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >=0 && data.payload.timeOutSeconds <=5 ? data.payload.timeOutSeconds : false ;

    if(protocol && url && method && successCodes && timeOutSeconds){
        //Get token form the url headers
        var token =  typeof(data.headers.token) == 'string' ? data.headers.token : false;
        //valid the token
        _data.read('tokens',token,function (err,tokenData) {
            if(!err && tokenData){
                //get phone number from tokenData
                var phone = tokenData.phone;
                //Valid the user
                _data.read('users',phone,function (err,userData) {
                    if(!err && userData){
                        //Create the checks or get the checks if alredy empty
                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        //check maxChecks
                        if(userChecks.length < config.maxChecks){
                            var checkId = helpers.createRandomString(20);

                            //Create checkOject to store in a checkId/filled
                            var checkObject ={
                                'id' : checkId,
                                'phone' : phone,
                                'protocol' : protocol,
                                'url' : url,
                                'method' : method,
                                'successCodes' : successCodes,
                                'timeOutSeconds' : timeOutSeconds
                            };

                            //Save the object by creating a file
                            _data.create('checks',checkId,checkObject,function (err) {
                                if(!err){
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    //Save the update
                                    _data.update('users',phone,userData,function(err) {
                                        if(!err){
                                            callback(200,checkObject);
                                        }else{
                                            callback(500,{'Error' : ''})
                                        }
                                    });
                                }else{
                                    callback(500,{'Error' : 'Could not create a new check'})
                                }
                            });
                        }else{
                            callback(400,{'Error' : 'user already created max numberof checks ('+userChecks.length+')'})
                        }
                    }else{
                        callback(403,{'Error' : 'No valid user found for the specified token'})
                    }
                });
            }else{
                callback(403,{'Error' : 'Invalid token specified :'+token})
            }
        });
    }else{
        callback(400,{'erro' : protocol+url+method+successCodes+timeOutSeconds});
    }

}


//check-> get
//Required data-> "Id"
//Optional data -> none
handlers._checks.get = function(data,callback) {
    //check for valid id
    var id = typeof(data.queryStringObject.id) =='string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){

        //Look up the _checks
        _data.read('checks',id,function(err,checkData) {
            if(!err & checkData){
                //Get a token from the headers
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                //Check for valid token
                handlers._tokens.verifyToken(token,checkData.phone,function (tokenIsValid) {
                    if(tokenIsValid){
                        callback(200,checkData);
                    }else{
                        callback(403 );
                    }
                });
            }else{
                callback(404);
            }
        });
    }else {
        callback(400,{'Erro':id})
    }
}

//check-> update
//Required data-> "Id"
//Optional data -> protocal,method,url,successCodes,timeOutSeconds..(there must be either one of them to update)
handlers._checks.put = function(data,callback) {
    //required -> phone
    var id = typeof(data.payload.id) == 'string' && data.payload.id.length == 20 ? data.payload.id.trim() : false ;

    //OptionalData
    var protocol = typeof(data.payload.protocol) == 'string' && ['http','https'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false ;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.length > 0 ? data.payload.url.trim() : false ;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false ;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false ;
    var timeOutSeconds = typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >=0 && data.payload.timeOutSeconds <=5 ? data.payload.timeOutSeconds : false ;

    //Check for the above
    if(id){
        if(protocol || url || method || successCodes || timeOutSeconds){
            //Look up the checks
            _data.read('checks',id,function(err,checkData) {
                if(!err && checkData){
                    //Get a token from the headers
                    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                    //Verify the token
                    handlers._tokens.verifyToken(token,checkData.phone,function(tokenIsValid) {
                        if(tokenIsValid){
                            if(protocol){
                                checkData.protocol = protocol;
                            }
                            if(url){
                                checkData.url = url;
                            }
                            if(method){
                                checkData.method = method;
                            }
                            if(successCodes){
                                checkData.successCodes = successCodes;
                            }
                            if(timeOutSeconds){
                                checkData.timeOutSeconds = timeOutSeconds;
                            }

                            //Update the data in the check
                            _data.update('checks',id,checkData,function (err) {
                                if(!err){
                                    callback(200);
                                }else{
                                    callback(500,{'Error':'Could not update the check'})
                                }
                            });
                        }else{
                            callback(403);
                        }
                    });
                }
            });
        }else{
            callback(400,{'Error':'Missing data to update'});
        }
    }else{
        callback(400,MissingReqField);
    }
};

//check-> delete
//Required data-> "Id"
//Optional data -> none
handlers._checks.delete = function (data,callback) {
    //Check id is valid
    var id = typeof(data.queryStringObject.id) =='string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){

        //Lookup for check by id
        _data.read('checks',id,function(err,checkData) {
            if(!err && checkData){

                //Get a token from the headers
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

                //Check for valid token
                handlers._tokens.verifyToken(token,checkData.phone,function (tokenIsValid) {
                    if(tokenIsValid){

                        //Delete check Data
                        _data.delete('checks',id,function (err) {
                            if(!err){
                                _data.read('users',checkData.phone,function (err,userData) {
                                    if(!err && data){

                                        //get check position
                                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        var checkPosition = userChecks.indexOf(id);

                                        if(checkPosition > -1){
                                            userChecks.splice(checkPosition,1);

                                            //Resave the users Data
                                            _data.update('users',userData.phone,userData,function (err) {
                                                if(!err){
                                                    callback(200);
                                                }else{
                                                    callback(500,{'Error' : 'Cound not update the user'});
                                                }
                                            });
                                        }else{
                                            callback(500,{'Error':'Could not find the check in the user object'})
                                        }
                                    }else {
                                        callback(500,{'Error' : 'Could not find the user who created the check so could not remove the check from the user object'});
                                    }
                                });
                            }else{
                                callback(400,{'Error':'Could not delete specified check'});
                            }
                        });
                    }else{
                        callback(403 , {'Error' : 'token is missing in the header fields or token is invlaid'});
                    }
                });
            }else{
                callback(400,{'Error':'invalid id'});
            }
        });
    }else {
        callback(400,MissingReqField);
    }
};



module.exports = handlers;
