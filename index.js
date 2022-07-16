#!/usr/bin/env node

'use strict';

const metalsmith = require('metalsmith');

const collections = require('@metalsmith/collections');
const layouts = require('@metalsmith/layouts');
const markdown = require('@metalsmith/markdown');
const permalinks = require('@metalsmith/permalinks');

const collect = require('./modules/collect.js');
const home = require('./modules/home.js');
const links = require('./modules/links.js');

const options = require('./modules/options.js')();

require('./modules/partials.js')(__dirname);

const collections_opts = {
    characters: {
        metadata: {
            title: 'Characters',
        },
    },
    factions: {
        metadata: {
            title: 'Factions',
        },
    },
    items: {
        metadata: {
            title: 'Items',
        },
    },
    journals: {
        metadata: {
            title: 'Journals',
        },
    },
    locations: {
        metadata: {
            title: 'Locations',
        },
    },
    npcs: {
        metadata: {
            title: 'NPCs',
        },
    },
    species: {
        metadata: {
            title: 'Species',
        },
    },
};

metalsmith(__dirname)
    .source(options.build.source)
    .destination(options.build.destination)
    .clean(true)
    .use(home())
    .use(collections(collections_opts))
    .use(collect())
    .use(markdown())
    .use(layouts({default: 'page.hbs'}))
    .use(links())
    .use(permalinks({relative: false}))
    .build(function(err, files) {
        if (err) { throw err; }
    });
