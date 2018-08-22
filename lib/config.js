var environment = {};

environment.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsAfuckIngHashingSecret',
    'maxChecks' : 5,
    'twilio' : {
        // 'accountSid' : 'AC33949ec9f000860e4bf6f4a5296c2ee1',
        // 'authToken' : '0995d6c436120313d10c290e2932580b',
        // 'fromPhone' : '+15595408531'
    },
    'templateGlobals' : {
        'appName' : 'UpOrDown',
        'yearCreated' : '2018',
        'companyName' : 'UpOrDown . Inc',
        'baseUrl' : 'http://localhost:3000'
    }
};

environment.production={
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsAfuckIngHashingPreductionSecret',
    'maxChecks' : 5,
    'twilio' : {
        // 'accountSid' : 'AC33949ec9f000860e4bf6f4a5296c2ee1',
        // 'authToken' : '0995d6c436120313d10c290e2932580b',
        // 'fromPhone' : '+15595408531'
    },
    'templateGlobals' : {
        'appName' : 'UpOrDown',
        'yearCreated' : '2018',
        'companyName' : 'UpOrDown . Inc',
        'baseUrl' : 'http://localhost:5000'
    }
};

var currentEnvironment = typeof(process.env.NODE_ENV) ==  'string' ? process.env.NODE_ENV : '';

var environmentToExport = typeof(environment[currentEnvironment]) == 'object' ? environment[currentEnvironment] : environment.staging;

module.exports = environmentToExport;
