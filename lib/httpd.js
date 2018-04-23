const express = require('express');
const compression = require('compression');
const serveStatic = require('serve-static');
const _ = require('lodash');

module.exports=function(config, logger){


    const app = express();
    const port = config.httpd.port;
    var static = serveStatic('lib/httpd/static', {'index': ['index.html', 'index.htm']});

    app.use(compression());
    app.use(function (req, res, next) {
        logger.info(`${req.method} ${req.originalUrl}`);
        next() // pass control to the next handler
    });
    app.all("/api/*",require("./httpd/api/_handler.js")(config,logger));


    app.get('*',static);

    app.listen(port,function(){
        logger.info(`HTTP Server listening on port ${port}`);
    });
};