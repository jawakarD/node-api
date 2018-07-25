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
        callback(400,{'Error':'Missing required fields'});
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
        callback(400,{'Error' : 'Mising req field'})
    }
};

//==========Users-put==============//
handlers._users.put = function (data,callback) {

}

//==========Users-delete==============//
handlers._users.delete = function (data,callback) {

}












module.exports = handlers;
