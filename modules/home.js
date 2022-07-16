'use strict';

module.exports = function() {
    return function(files, metalsmith, done) {
        const home = files['index.md'];
        home.isHome = true;

        done();
    }
};
