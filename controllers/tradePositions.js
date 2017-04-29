'use strict';

var utils = require('../utils');
var _ = require('lodash');
var Stream = require('../streams/stream');
var Positions = require('../collections/positions');
var Instrument = require('../models/instrument');
var async = require('async');
var config = require('../config');

module.exports = function(req, res, next) {
    var exclusions = [];
    if (_.has(req.body, 'exclusions')) {
        exclusions = exclusions.concat(utils.splitStringList(req.body.exclusions));
    }

    var spread = {};

    new Positions().fetch()
    .then((positions) => {
        return excludePositions(exclusions, positions.toJSON());
    }).catch((err) => { console.log(err) })
    .then((symbols) => {
        return symbols.length > 0 ? openStream(symbols[0]) : new Promise((resolve) => { resolve(null) });
    }).catch((err) => { console.log(err) })
    .then((priceStream) => {
        if (priceStream) {
            res.json({message: "Connected to GroundWire socket"});
            console.log('-------------------------------------');
            console.log('T R A D I N G   C O N F I G');
            console.log('-------------------------------------');
            console.log('simulation mode:', process.env.SIMULATE ? 'on' : 'off');
            console.log('Max spread:', config.get('trading.spread.max'));
            console.log('Min spread:', config.get('trading.spread.min'));
            console.log('-------------------------------------');
            priceStream.on('frame', (frame) => {
                switch(frame.type) {
                    case 'bid':
                        spread.bid = frame.price;
                        break;
                    case 'ask':
                        spread.ask = frame.price;
                        break;
                    case 'last':
                        spread.last = frame.price;
                }
                if (_.has(spread, 'bid') && _.has(spread, 'ask')) {
                    var maxdiff = config.get('trading.spread.max') * spread.ask;
                    var mindiff = config.get('trading.spread.min') * spread.ask;
                    if (((spread.ask - spread.bid) < maxdiff) && ((spread.ask - spread.bid) > mindiff) && (spread.ask - spread.bid > 0)) {
                        console.log(spread);
                    }
                }
            });
        } else {
            res.json({message: "No tradeable instruments were found"});
        }
    }).catch((err) => { console.log(err) });
}

var openStream = function(ticker) {
    return new Promise((resolve, reject) => {
        let connect_handler = () => {
            console.log('Connected to the GroundWire price socket!');
        };

        let close_handler = (reason) => {
            console.log('Disconnected from the GroundWire price socket...  Goodbye!');
            console.log(reason);
        };

        let error_handler = (err) => {
            console.log('There was an error connecting to the GroundWire price socket');
            reject(err);
        };

        let outStream = new Stream({
            ticker: ticker,
            simulate: process.env.SIMULATE,
            connect_handler: connect_handler,
            close_handler: close_handler,
            error_handler: error_handler
        });
        resolve(outStream);
    });
}

var excludePositions = function(exclusions, positions) {
    var ret = [];
    return new Promise((resolve, reject) => {
        async.eachSeries(positions, (position, callback) => {
            Instrument.getInstance({instrument: utils.parseInstrumentIdFromUrl(position.instrument)})
            .fetch()
            .then((inst) => {
                if (!utils.inArray(inst.toJSON().symbol, exclusions)) {
                    ret.push(inst.get('symbol'));
                }
                callback();
            });
        },
        (err) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(ret);
        });
    });
}