'use strict';

module.exports = function() {
    return function(files, metalsmith) {
        const home = files['index.md'];
        home.isHome = true;
    }
};
