'use strict';

module.exports = function (grunt) {

    var _ = require('lodash'),
        art = grunt.file.read('test/fixtures/artwork.png'),
        prefix = 'lib/public/',
        files = [
            'artwork.png',
            'testimage.png'
        ],
        ids = require('../../fixtures/mongodb/db/test/ids');

    grunt.registerTask('test', ['jshint', 'shell:testSetup', 'shell:testRun']);

    grunt.registerTask('generatePublicTest', function() {
        grunt.log.subhead('Deprecated: use grunt:test:generatePublic');
    });
    grunt.registerTask('deletePublicTest', function() {
        grunt.log.subhead('Deprecated: use grunt:test:deletePublic');
    });
    grunt.registerTask('test:generatePublic', function() {
        _.each(files, function(theFile) {
            _.each(ids, function(theId) {
                grunt.file.write(prefix + '/' + theId + '/' + theFile, art);
            });
        });
    });
    grunt.registerTask('test:deletePublic', function() {
        _.each(ids, function(theId) {
            grunt.file.delete(prefix + '/' + theId);
        });
    });
};