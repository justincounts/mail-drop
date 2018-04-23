const async = require('async');
const moment = require('moment');
const _ = require('lodash');
const utils = require('../../utils');

module.exports = function(config,logger,redis,req, res, next){

    const id = req.query.id;
    async.auto({
        "message": getMessage,
        "inboxes": ["message", getInboxes],
        "removeFromInboxes": ["inboxes",removeFromInboxes],
        "deleteMessages": ["removeFromInboxes",deleteMessage],

    },function(err,json){
        if(err){
            res.setStatus(500).json({text:"Unable To Delete Message", class:"is-danger"});
        } else {
            res.json({text:"Message Deleted", class:"is-success"});
        }
        next();
    });


    function getMessage(callback){
        redis.get(id,function(err,message){
            if(err){
                return callback(err);
            }
            callback(null,message);
        });
    }

    function getInboxes(results,callback){
        const json = JSON.parse(results['message']);
        var inbox = json.to.text.replace(/@.*/,"");
        callback(null,utils.mapToNormalized(inbox))

    }

    function removeFromInboxes(results,callback){
        const inboxes = results['inboxes'];
        async.each(inboxes,function(inbox,eachCb){
            const key = 'inbox:'+inbox;
            redis.hdel(key,id,eachCb);
        },function(err){
            callback(err,null);
        });

    }



    function deleteMessage(results,callback){
        redis.del(id,callback);
    }
};