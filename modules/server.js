'use strict';

const http = require('http');
const serveStatic = require('serve-static');

module.exports.start = function (path) {
    const serve = serveStatic(
        path,
        {
            index: ['index.html'],
        }
    );

    http.createServer((req, res) => {
        serve(req, res, (err) => {
            res.end(err);
        });
    }).listen(8080);

    console.log('Dev server running at http://localhost:8080')
}
