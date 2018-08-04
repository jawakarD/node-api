/*
 *
 * data handler for users service
 *
 */


//Dependencies=======================
var _data = require('./data');
var helpers = require('./helpers');

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

// TODO: onlu let authenticates user access there object
handlers._users.get = function (data,callback) {
    //check for valid phone
    var phone = typeof(data.queryStringObject.phone) =='string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        _data.read('users',phone,function (err,data) {
            if(!err && data){
                //Remove hashwdpassword;
                delete data.password;
                callback(200,data);
            }else {
                callback(404);
            }
        });
    }else {
        callback(400,MissingReqField)
    }
};

//==========Users-put==============//
// TODO: Authenticate users to access only their Data
handlers._users.put = function (data,callback) {

    //required -> phone
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone.trim() : false ;

    //Optional firatName...lastName...password...tosAgreement... but required atleast one field
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.length > 0 ? data.payload.lastName.trim() : false ;
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.length > 0 ? data.payload.firstName.trim(): false ;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.length > 0 ? data.payload.password.trim() : false ;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ?  true : false ;

    if(phone){
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
            callback(400,MissingReqField);
        }
    }else{
        callback(400,{'Error':phone});
    }

}

//==========Users-delete==============//
//re - > phone
// TODO: Authenticate users to delete only their Data
handlers._users.delete = function (data,callback) {
    //Check for phoneNumber
    var phone = typeof(data.queryStringObject.phone) =='string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        _data.read('users',phone,function (err,data) {
            if(!err && data){
                _data.delete('users',phone,function (err) {
                    if(!err){
                        callback(200);
                    }else{
                        callback(500,{'Error' : 'Cound not delete'});
                    }
                });
            }else {
                callback(400,{'Error' : 'User not found'});
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
handlers.delete = function (data,callback) {

};









module.exports = handlers;
