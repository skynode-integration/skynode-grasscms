'use strict';

const express = require('express');

/**
 * You can register your own code here on startup.
 * You can return synchronously or via a promise
 */
module.exports = function(grasshopper, app) {
    const router = express.Router();

    // This will be at /admin/test/activity
    router.get('/activity', (req, res) => {
        res.json(['it', 'works']);
    });
    
    return router;
};
