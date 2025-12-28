'use strict';

const process = require('node:process');

let lastTime = null
const measurements = [];

module.exports.init = function() {
    return function(files, metalsmith) {
        lastTime = performance.now();
    };
}

module.exports.measure = function(name) {
    if (process.env.RPGNOTES_PERFORMANCE) {
        return function(files, metalsmith) {
            const nowTime = performance.now();
            measurements.push({name, time: nowTime - lastTime});
            lastTime = nowTime;
        };
    } else {
        return function(files, metalsmith) {};
    }
};

module.exports.result = function() {
    if (process.env.RPGNOTES_PERFORMANCE) {
        return function(files, metalsmith) {
            let maxNameLength = 0;
            for (const measurement of measurements) {
                if (measurement.name.length > maxNameLength) {
                    maxNameLength = measurement.name.length;
                }
            }

            for (const measurement of measurements) {
                const padding = maxNameLength + 2 - measurement.name.length;
                console.log(`${measurement.name}:${' '.repeat(padding)}${measurement.time}ms`);
            }
        };
    } else {
        return function(files, metalsmith) {
            const nowTime = performance.now();
            console.log(`Site generated in ${Math.round(nowTime - lastTime)}ms`);
        };
    }
};
