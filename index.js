#!/usr/bin/env node

'use strict';

const process = require('node:process');

const metalsmith = require('metalsmith');

const brokenLinkChecker = require('metalsmith-broken-link-checker');
const collections = require('@metalsmith/collections');
const layouts = require('@metalsmith/layouts');
const markdown = require('@metalsmith/markdown');
const permalinks = require('@metalsmith/permalinks');

const alignment = require('./modules/alignment.js');
const css = require('./modules/css.js');
const collect = require('./modules/collect.js');
const gitDate = require('./modules/gitDate.js');
const home = require('./modules/home.js');
const links = require('./modules/links.js');
const search = require('./modules/search.js');
const secrets = require('./modules/secrets.js');
const validate = require('./modules/validate.js');

const options = require('./modules/options.js')();

require('./modules/partials.js')(__dirname);

const collections_opts = {};
for (const collection of options.collections) {
    collections_opts[collection.name] = {metadata: {
        title: collection.title,
        reverse: collection.reverse,
    }};
}

const gmMode = process.argv.includes('--gm-mode');

const buildDate = new Date();
const buildDateDisplay = buildDate.toUTCString();
const buildDateIso = buildDate.toISOString();

metalsmith(__dirname)
    .metadata({
        siteTitle: options.about.title,
        buildDateDisplay,
        buildDateIso,
    })
    .source(options.build.source)
    .destination(options.build.destination)
    .clean(true)
    .use(secrets.pages(gmMode))
    .use(gitDate(options.build.source))
    .use(home())
    .use(css(__dirname))
    .use(search.page(__dirname))
    .use(collections(collections_opts))
    .use(collect())
    .use(markdown())
    .use(alignment())
    .use(secrets.sections(gmMode))
    .use(validate())
    .use(links.analyze())
    .use(layouts({
        default: 'page.hbs',
        pattern: '**/*.html',
    }))
    .use(links.transform(gmMode))
    .use(permalinks({relative: false}))
    .use(brokenLinkChecker({checkAnchors: true}))
    .use(search.index())
    .build(function(err, files) {
        if (err) { throw err; }
    });
