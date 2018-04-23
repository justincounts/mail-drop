const async = require('async');
const moment = require('moment');
const _ = require('lodash');
const utils = require("../../utils");
const keyScanner = require("../../utils/redis/key-scanner");
const MAX_KEYS = "1000";
module.exports = function(config,logger,redis,req, res, next){

    const inbox = req.query.name;
    async.auto({
        messages: getMessages,
        deleteMessages: ["messages", deleteMessages],
        deleteInboxes:["messages", deleteInboxes]
    },function(err){
        if(err){
            res.setStatus(500).json({text:"Unable To Delete Inbox", class:"is-danger"});
        } else {
            res.json({text: `Deleted all messages in inbox ${inbox.substr(6)}`, class: 'is-success'});
        }
        next();
    });


    function getMessages(callback){
        redis.hgetall(inbox, function(err,data){
            var ids = [];
            _.each(data, function(message,id){
                ids.push(id);
            });
            callback(null,ids);
        });
    }

    function deleteMessages(results,callback){
        var messages = results['messages'];
        redis.del.call(redis, messages,function(error,count){
            if(error){
                logger.error('Unable to Delete Messages',{error: error});
                callback(error);
            }
            logger.info(`Deleted ${count} messages`);
            callback(null,count);
        });
    }

    function deleteInboxes(results,callback){
     keyScanner(redis,`${inbox}*`,MAX_KEYS,function(err,inboxes){
            if(err){
                return callback(err);
            }

            var subinboxes= inboxes.filter(i=>  utils.getCanonicalInbox(i) === inbox);
            var all =_.uniq(subinboxes.concat(utils.mapToNormalized(inbox)));
            async.each(all,function(i, icb){
                async.each(results['messages'],(m,mcb)=>{
                    redis.hdel(i,m,mcb);
                }, icb);
            },callback);
        });
    }
};