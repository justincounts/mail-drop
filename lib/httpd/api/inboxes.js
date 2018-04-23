const keyScanner = require("../../utils/redis/key-scanner");
const async = require('async');
const _ = require('lodash');
const MAX_KEYS = "50";

module.exports = function(config,logger,redis,req, res, next){

    const term = req.query.term ? `inbox:${req.query.term.toLowerCase()}*` : `inbox:*`;

    var inboxes =keyScanner(redis,term,MAX_KEYS,function(err,inboxes){
        res.json({
            inboxes: _.sortBy(inboxes,_.identity),
        });
        next();
    });
};