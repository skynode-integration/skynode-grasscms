'use strict';

const express = require('express');

module.exports = function(grasshopper, app) {
    const router = express.Router();

    router.get('/', function(req, res, next) {
        // use grasshopper to get stuff out of the database
        // attach to res.locals to use in your template
        grasshopper.authenticatedRequest.users.list()
            .then(users => {
                res.locals.users = users.results;

                next();
            });
    });

    return router;
};