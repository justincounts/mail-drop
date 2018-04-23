const async = require('async');
const _ = require('lodash');

module.exports = function(redis, keyPrefix, limit, callback){
    var prefix = keyPrefix.endsWith("*")? keyPrefix : `${keyPrefix}*`;
    var keys =[];
    var cursor = "0";
    var hasNext = true;

    async.until(
        ()=>{return !hasNext || checkLimit()},
        function(untillCallback){
            //console.log(`SCAN ${cursor} MATCH ${prefix}`);
            redis.scan(cursor,"MATCH",prefix,function(err,data){
                if(err){
                    hasNext = false;
                    error = err;
                    return untillCallback(err);
                } else {
                    hasNext = (data[0]!== "0");
                    cursor = data[0];
                    _.each(data[1],function(key){
                        keys.push(key);
                    });
                    untillCallback(null);
                }
            });
        },function(err){
            callback(err,keys.slice(0,limit||keys.length));
        }
    );

    function checkLimit(){
        if(limit && limit > 0 ){
            return keys.length >= limit;
        }
        return false;
    }

};