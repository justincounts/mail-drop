const Redis = require("redis");
const _ = require("lodash");


module.exports = function(config, logger){

    const redis = Redis.createClient({
        host: config.hostname,
        db: config.database
    });

    redis.on("error", function (err) {
        logger.error("Redis Client Error",err);
        process.exit(err);
    });

    const endpoints =[
        { pattern:/^inboxes/i , handler: require("./inboxes.js") },
        { pattern:/^inbox/i   , handler: require("./inbox.js") },
        { pattern:/^message/i   , handler: require("./message.js") },
        { pattern:/^delete\/message/i   , handler: require("./delete-message.js") },
        { pattern:/^delete\/inbox/i   , handler: require("./delete-inbox.js") }
    ];

    return function (req, res, next) {
        const url = req.url.replace(/^\/api\//,"");
        var reMatch = undefined;
        var module = _.find(endpoints, function(endpoint){
            reMatch = undefined;

            if(endpoint.pattern instanceof RegExp){
                reMatch = endpoint.pattern.exec(url);
                return reMatch;
            } else {
                return endpoint.pattern === url;
            }
        });

        if(module){
            res.set('Content-Type', 'application/json');
            return module.handler(config,logger,redis,req, res, next);
        } else {
            logger.error(`404 ${url} Not Found`);
            next();
        }
    }
};