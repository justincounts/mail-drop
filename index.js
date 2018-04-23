const Smtp = require('./lib/smtp.js');
const Httpd = require('./lib/httpd.js');
const Logger = require('bunyan');

const log = new Logger({name: "mail-drop"});

const yargs = require('yargs')
    .alias('r', 'redis-db')
    .describe('r', 'which Redis Database # to use?')
    .default('r', 9)
    .alias('h', 'redis-host')
    .describe('h', 'Redis hostname')
    .default('h', "127.0.0.1")
    .alias('d', 'domain')
    .describe('d', 'Domain to Accept Emails for')
    .default('d', 'seasoned.pizza')
    .help('help')
    .parse();

const config ={
    domain: yargs.d,
    redis: {
        hostname: yargs.h,
        database: yargs.r
    }
};

log.info(`Starting Mail Drop for ${config['domain']}`,{configuration: config});

const smtp = Smtp(config, new Logger({name: 'mail-smtp'}));
const httpd = Httpd(config, new Logger({name: 'mail-http'}));



