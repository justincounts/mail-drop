const async = require('async');
const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const Redis = require("redis");
const utils = require("./utils");
const process = require("process");
const uuid = require('uuid/v4');

module.exports=function(config, logger){
    logger.info('SMTP Server Startup');

    const ports = [25, 465, 587,2525];

    const allowedAddresses = `^.+@${config.domain}$`;
    const allowedAddressRegExp = new RegExp(allowedAddresses,'i');

    const redis = Redis.createClient({
        host: config.hostname,
        db: config.database
    });

    redis.on("error", function (err) {
        logger.error("Redis Client Error",err);
        process.exit(err);
    });


    const server = new SMTPServer({
        secure: false,
        name: 'mx.seasoned.co',
        authOptional:true,
        disabledCommands:["AUTH"],
        onRcptTo: onRecipientTo,
        onData: onData,
        onAuth: (auth,session,callback)=>{callback({user: 'seasoned'})}
    });

    async.each(ports, function(port,callback){
        server.listen(port, function(){
            try {
                logger.info(`Listening on port ${port}`);
            } catch(eaccess){
                logger.warn(`Unable to Listen on port ${port}`,eaccess);
            } finally {
                callback();
            }
        });
    });


    function onRecipientTo(address, session, callback){
        if( allowedAddressRegExp.test(address.address)){
            return callback();
        }
        const err = `rejected email for ${address.address}`;
        logger.warn(err);
        return callback(new Error(err));
    }

    function onData(stream, session, callback){

        simpleParser(stream, (err, mail)=>{
            try {
                if (err) {
                    logger.error("Unable to parse Message", {error: err});
                    return callback(err);
                }

                mail['_id'] = uuid();

                async.waterfall([
                    async.constant(mail),
                    storeMessage,
                    addToInboxes,
                ], function (err, result) {
                    if (err) {
                        logger.error(`Unable to Store Message ${mail.messageId}`, {error: err});
                        return callback(err);
                    }
                    logger.info("Received Email ", {messageId: mail.messageId, to: mail.to.text, id: mail['_id']});
                    return callback();
                });
            } catch(err){
                logger.error(`Unable to Store Message ${mail.messageId}`,{error: err});
            }
        });
    };

    function storeMessage(mail,callback){
        const key = utils.getMessageKey(mail['_id']);
        redis.set(key, JSON.stringify(mail),andExpire(key,function(err){
            callback(err,mail,key);
        }));
    }

    function addToInboxes(mail,messageKey,callback){
        const keys = utils.toStringAddresses(mail,config.domain);
        async.each(keys,function(key,eachCallback){
            redis.hset(`inbox:${key}`,messageKey, utils.toSummary(mail,messageKey), andExpire(key,eachCallback));
        },function(err){
            logger.info(`Added ${messageKey} to inboxes: `,keys);
            callback(err);
        });
    }


    function andExpire(key,callback){
        return (err,data)=> {
            redis.expire(key, utils.getExpiry(), function(eError,eData){
                if(eError){
                    logger.error(`Error Setting expiry on Key: ${key}`,eError);
                }
                return callback(err,data);
            });
        }
    };
};