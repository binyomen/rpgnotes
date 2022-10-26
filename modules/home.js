'use strict';

module.exports = function() {
    return function(files, metalsmith) {
        const home = files['index.md'];
        home.isHome = true;

        // Set this to something that resolves to the empty string in templates
        // but isn't falsey so it won't be overwritten.
        home.path = Buffer.from('');
    }
};
