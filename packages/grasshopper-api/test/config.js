require('chai').should();

describe('the ghapi.json config file', function(){
    'use strict';

    var Request = require('../lib/utils/request'),
        reqObjWithDefaultInParams = {
            query : {
                limit : 650
            }
        },
        reqObjWithoutDefaultInParams = {
            query : {}
        },
        grasshopper = require('grasshopper-core');

    beforeEach(function() {
        grasshopper.config.db.defaultPageSize = 100000;
    });

    describe('the db.defaultPageSize config', function() {
        describe('when set', function() {
            describe('and one is passes into the query', function() {
                it('respects the limit in the query', function() {
                    var request = new Request(),
                        listPageSize = request.getListPageSize(reqObjWithDefaultInParams);

                    listPageSize.should.equal(reqObjWithDefaultInParams.query.limit);
                });
            });
            describe('and one is not passed into the query', function() {
                it('respects the default', function() {
                    var request, listPageSize;

                    grasshopper.config.db.defaultPageSize = 840;

                    request = new Request();

                    listPageSize = request.getListPageSize(reqObjWithoutDefaultInParams);

                    listPageSize.should.equal(840);
                });
            });
        });
        describe('when not set', function() {
            describe('and one is passed into the query', function() {
                it('uses the limit in the query', function() {
                    var request = new Request(),
                        listPageSize = request.getListPageSize(reqObjWithDefaultInParams);

                    listPageSize.should.equal(reqObjWithDefaultInParams.query.limit);
                });
            });
            describe('and one is not passed into the query', function() {
                it('uses the default of 200', function() {
                    var request = new Request(),
                        listPageSize = request.getListPageSize(reqObjWithoutDefaultInParams);

                    listPageSize.should.equal(100000);
                });
            });
        });
    });
});
