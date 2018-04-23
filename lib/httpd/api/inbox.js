const async = require('async');
const _ = require('lodash');
const moment = require('moment');
const utils = require("../../utils");
const keyScanner = require("../../utils/redis/key-scanner");


module.exports = function(config,logger,redis,req, res, next){

    const inbox = req.query.name;
    
    async.auto({
        "name": async.constant(inbox),
        "summaries": getMessageSummaries,
        "superInboxes": getSuperAddressInboxes,
        "subInboxes": getSubAddressInboxes
    },function(err,results){
        if(err){
            logger.error(`Error Retrieving inbox ${inbox}`,{error: err});
            return res.json({
                message: "Internal Server Error",
                error: err
            })
        }
        results['total'] = results['summaries'].length;
        res.json(results);
        next();
    });

    function  getMessageSummaries(callback){
        redis.hgetall(inbox, function(err,data){
            var summaries = [];
            _.each(data, function(message){
                summaries.push(JSON.parse(message));
            });
            callback(null,summaries);
        });
    }

    function getSubAddressInboxes(callback){
        const keyScanner = require("../../utils/redis/key-scanner");
        keyScanner(redis,inbox,null,function(error,inboxes){
            if(error){
                logger.warn('Error Retrieving SubAdressing Inboxes',error);
            } else {
                inboxes = inboxes.filter((i)=> i !== inbox)
                    .filter((i)=> inbox === utils.getCanonicalInbox(i));
                callback(null,inboxes);
            }
        });
    }

    function getSuperAddressInboxes(callback){
        var address = inbox.replace(/^inbox:/,"");
        var normalized = utils.mapToNormalized(address)
            .filter((a)=> a !== address)
            .map((a)=> `inbox:${a}`);
        callback(null,normalized);
    }

};