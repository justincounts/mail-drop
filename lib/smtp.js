const async = require('async');
const SMTPServer = require('smtp-server').SMTPServer;


module.exports=function(config, logger){
    logger.info('SMTP Server Startup');

    const ports = [25, 465, 587,2525];

    const allowedAddresses = `^.+@${config.domain}$`;
    const allowedAddressRegExp = new RegExp(allowedAddresses,'i');

    const server = new SMTPServer({
        secure: false,
        onRcptTo: onRecipientTo,
        onData: onData
    });

    async.each(ports, function(port,callback){
        server.listen(port, function(){
            try {
                logger.info(`Listening on port ${port}`);
            } catch(eaccess){
                logger.warn(`Unable to Listen on port ${port}`,eaccess);
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
        logger.info("Recieved Email",{session: session});
        stream.pipe(process.stdout);
        stream.on('end', callback);
    };

};