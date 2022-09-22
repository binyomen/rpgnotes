'use strict';

module.exports = {
    selectElement: function($, selector, element) {
        return $(selector, element)
            .prop('outerHTML')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
    },
};
