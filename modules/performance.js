'use strict';

const util = require('./util.js');

let lastTime = null;
let doDetailedMeasurement = false;
const measurements = [];

module.exports.init = function (detailed) {
    doDetailedMeasurement = detailed;
    return function () {
        lastTime = performance.now();
    };
}

module.exports.measure = function (name) {
    if (doDetailedMeasurement) {
        return function () {
            const nowTime = performance.now();
            measurements.push({ name, time: nowTime - lastTime });
            lastTime = nowTime;
        };
    } else {
        return function () { };
    }
};

module.exports.result = function () {
    if (doDetailedMeasurement) {
        return function () {
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
        return function () {
            const nowTime = performance.now();
            util.info(`Site generated in ${Math.round(nowTime - lastTime)}ms`);
        };
    }
};
