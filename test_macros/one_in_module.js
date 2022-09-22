'use strict';

module.exports = function($, args, element) {
    const html = element.html().replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return `<p>${JSON.stringify(args)}</p><p>${html}</p>`;
};
