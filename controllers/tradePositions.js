'use strict';

var utils = require('../utils');
var _ = require('lodash');
var Stream = require('../streams/stream');
var Positions = require('../collections/positions');
var Instrument = require('../models/instrument');
var async = require('async');
var config = require('../config');
var strategies = {slope: require('../strategies/slope')};

module.exports = function(req, res, next) {
    var exclusions = [];
    if (_.has(req.body, 'exclusions')) {
        exclusions = exclusions.concat(utils.splitStringList(req.body.exclusions));
    }
    if (!_.has(req.body, 'stopmargin')) {
        return utils.throwError("No stop margin was found! Please include a stop margin percentage...", res);
    }
    let stopMargin = parseFloat(req.body.stopmargin);
    
    if (!stopMargin) return utils.throwError("Invalid stop margin provided", res);

    // The container that will house all data about the state of the current tick of market data
    var tick = {};
    var stopPrice, simulation_state;
    switch (process.env.SIMULATE) {
        case 0:
            simulation_state = 'on';
            break;
        default:
            simulation_state = 'off';
    }

    new Positions().fetch()
    .then((positions) => {
        return excludePositions(exclusions, positions.toJSON());
    }).catch((err) => { utils.throwError(err, res) })
    .then((symbols) => {
        return symbols.length > 0 ? openStream(symbols[0]) : utils.nullPromise();
    }).catch((err) => { utils.throwError(err, res) })
    .then((priceStream) => {
        if (priceStream) {
            res.json({message: "Connected to GroundWire socket"});
            console.log('-------------------------------------');
            console.log('T R A D I N G   C O N F I G');
            console.log('-------------------------------------');
            console.log('simulation mode:', simulation_state);
            console.log('initial stop margin:', stopMargin);
            console.log('Max spread:', config.get('trading.spread.max'));
            console.log('Min spread:', config.get('trading.spread.min'));
            console.log('-------------------------------------');
            priceStream.on('frame', (frame) => {
                switch(frame.type) {
                    case 'bid':
                        tick.bid = frame.price;
                        break;
                    case 'ask':
                        tick.ask = frame.price;
                        break;
                    case 'last':
                        tick.last = frame.price;
                }
                if (_.has(tick, 'bid') && _.has(tick, 'ask')) {
                    var maxdiff = config.get('trading.spread.max') * tick.ask;
                    var mindiff = config.get('trading.spread.min') * tick.ask;
                    if (((tick.ask - tick.bid) < maxdiff) && ((tick.ask - tick.bid) > mindiff) && (tick.ask - tick.bid > 0)) {
                        // Initial stop price or calculated new stopPrice
                        stopPrice = !stopPrice ?
                        tick.ask / (1 + stopMargin) :
                        stopPrice = tick.lastask ? strategies.slope(tick.lastask, tick.ask, stopPrice, config.get('trading.strategies.slope.c'), config.get('trading.strategies.minStopMargin')) : stopPrice;
                        
                        tick.stop = utils.moneyify(stopPrice);
                        
                        if (tick.stop < tick.ask) {
                            console.log(tick);
                            tick.lastbid = _.has(tick, 'bid') ? tick.bid : null;
                            tick.lastask = _.has(tick, 'ask') ? tick.ask : null;
                            tick.lastlast = _.has(tick, 'last') ? tick.last : null;
                        } else {
                            console.log('---------------------------------------------');
                            console.log("Stopped out at:",tick.stop);
                            console.log("Ask price was:", tick.ask);
                            console.log('---------------------------------------------');
                            priceStream.disconnect();
                        }
                    }
                }
            });
            priceStream.on('close', (reason) => {
                console.log("Exited price stream:", reason);
            });
        } else {
            res.json({message: "No tradeable instruments were found"});
        }
    }).catch((err) => { utils.throwError(err, res) });
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