/**
 * Main library entry point. The module will return a function. If you are using it inside of another project then you
 * should require in grasshopper and execute the function. If you are using GH as a standalone app then you should
 * execute bin/grasshopper-js
 *
 * @param proxy - Express app that you want to use to act as a proxy to the grasshopper api
 */
module.exports = function(options){
    'use strict';
    var fs = require('fs'),
        _ = require('lodash'),
        path = require('path'),
        http = require('http'),
        https = require('https'),
        morgan = require('morgan'),
        semver = require('semver'),
        express = require('express'),
        bodyParser = require('body-parser'),
        cookieParser = require('cookie-parser'),
        session = require('express-session'),
        MongoStore = require('connect-mongo' + (semver.lt(process.version, '4.0.0') ? '/es5' : ''))(session), //Support legacy nodes
        bridgetown = require('bridgetown-api'),
        grasshopper = require('grasshopper-core').init(options),
        methodOverride = require('method-override'),
        setHeaders = require('./middleware/setHeaders'),
        ghapiRouter = express.Router(),
        PORT = (process.argv.length == 3 && process.argv[2] !== 'test') ? process.argv[2] : (process.env.PORT || 3000),
        bodyParserOptions = {
            limit : '2mb',
            extended : true
        },
        serverOptions = {},
        ssl = false,
        useProxy = false,
        expressApp,
        middlewares,
        sessionStore,
        requestLogger = options && options.requestLogger,
        Grant = require('grant').express(),
        grant = new Grant({
            server: {
                protocol: (grasshopper.config.server.https) ? 'https' : 'http',
                host: grasshopper.config.server.host
            },
            facebook: grasshopper.config.identities.facebook,
            twitter: grasshopper.config.identities.twitter,
            instagram: grasshopper.config.identities.instagram,
            pinterest: grasshopper.config.identities.pinterest
        }),
        routePath;
    
    if (options && options.bodyParser) {
        bodyParserOptions = _.extend(bodyParserOptions, options.bodyParser);
    }

    //Setup bridgetown configuration
    bridgetown.configure(function(){
        this.validate.token(function(authentication){
            return grasshopper.request(authentication.token).users.current();
        });
    });

    //Configure Express App
    ghapiRouter.use(express.static(__dirname + '/public'));

    middlewares = [setHeaders];

    if (false !== requestLogger) {
        middlewares.push(morgan(requestLogger ? requestLogger : 'tiny'));
    }

    //Set the global route params for the given application route.
    ghapiRouter.route('*').all(middlewares.concat([
        methodOverride(),
        bodyParser.json(bodyParserOptions),
        bodyParser.urlencoded(bodyParserOptions),
        cookieParser(grasshopper.config.crypto.secret_passphrase)
    ]));

    if( grasshopper.config.server ) {
        if( grasshopper.config.server.https ) {
            serverOptions.key = fs.readFileSync(path.join(process.cwd(), grasshopper.config.server.https.key));
            serverOptions.cert = fs.readFileSync(path.join(process.cwd(), grasshopper.config.server.https.cert));
            ssl = true;
        }

        if( grasshopper.config.server.proxy === true ) {
            useProxy = true;
        }
    }

    //IF this is a mongo connection then use the mongodb as a session storage engine
    if(grasshopper.config.db.type === 'mongodb'){
        sessionStore = new MongoStore({ url: grasshopper.config.db.host });
    }

    //For redirect URL of your OAuth application always use this format:
    //[protocol]://[host]/connect/[provider]/callback
    ghapiRouter.use(session({
        secret:grasshopper.config.crypto.secret_passphrase,
        cookie: { secure: ssl, maxAge: (3600 * 1000 * 24 * 120) }, // Cookie expires in 120 days (rolling)
        name: 'gh-data',
        proxy: true,
        resave: false,
        store: sessionStore,
        saveUninitialized: false
    }));

    //Load in API Routes
    require('./routes/token')(ghapiRouter);
    require('./routes/google')(ghapiRouter);
    require('./routes/social/facebook')(ghapiRouter);
    require('./routes/social/twitter')(ghapiRouter);
    require('./routes/social/instagram')(ghapiRouter);
    require('./routes/social/pinterest')(ghapiRouter);
    require('./routes/users')(ghapiRouter);
    require('./routes/contentTypes')(ghapiRouter);
    require('./routes/content')(ghapiRouter);
    require('./routes/nodes')(ghapiRouter);
    require('./routes/system')(ghapiRouter);

    ghapiRouter.use(grant);

    //Only start a server if a proxy is not available.
    if(!useProxy){

        expressApp = express();
        // Only setup router if no proxy if passed in
        // If there is a proxy, then assume the user will setup the router with their desired mount path when they see fit
        routePath = expressApp.get('grasshopper route prefix') || '/';
        expressApp.use(routePath, ghapiRouter);

        if(ssl) {
            https.createServer(serverOptions, expressApp).listen(PORT, function(){
                console.log('Listening securely on port ' + PORT + '...');
            });
        }
        else {
            http.createServer(expressApp).listen(PORT, function(){
                console.log('Listening on port ' + PORT + '...');
            });
        }

    }

    return {
        bridgetown : bridgetown,
        router : ghapiRouter,
        core : grasshopper
    };
};
