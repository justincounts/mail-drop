const async = require('async');
const moment = require('moment');
const _ = require('lodash');
const MAX_KEYS = "50";

module.exports = function(config,logger,redis,req, res, next){

    const id = req.query.id;

    redis.get(id,function(err,message){
        if(err){
            return res.sendStatus(500).json({
                message: "Internal Server Error",
                error: err
            });
        } else if(!message){
            return res.sendStatus(404).json({
                message: "Not Found",
                error: err
            })
        }

        var json = JSON.parse(message);
        if(json && json.date) {
            json['timestamp'] = moment(json.date).utc().valueOf();
        }
        res.json(json);
        next();
    });


};