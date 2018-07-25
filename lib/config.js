var environment = {};

environment.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsAfuckIngHashingSecret'
};

environment.production={
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsAfuckIngHashingPreductionSecret'
};

var currentEnvironment = typeof(process.env.NODE_ENV) ==  'string' ? process.env.NODE_ENV : '';

var environmentToExport = typeof(environment[currentEnvironment]) == 'object' ? environment[currentEnvironment] : environment.staging;

module.exports = environmentToExport;
