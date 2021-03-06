"use strict";
var EventEmitter = require('events');
var request = require('request');
var utils = require('../utils');
var fs = require('fs');
var config = require('../config');

class CollectionEmitter extends EventEmitter {}

module.exports = class Collection {
  constructor(options={}) {
    this.collectionEmitter = new CollectionEmitter();
    this.url = null;
    this.modelClass = null;
    this.models = [];
    this.url = null;
    this.length = 0;
  }
  populate(models) {
    for (var i in models) {
      this.models.push(this.modelClass.getInstance(models[i]));
      this.length++;
    }
    return this;
  }
  fetch() {
    var options = config.get('ajax.fetch.options');
    options.url = this.url;
    return new Promise((resolve, reject) => {
      request(options, (err, response, body) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        let collection = JSON.parse(body);
        var results = utils.hasKey('results', collection) ? collection.results : collection;
        for (var i in results) {
          this.models.push(this.modelClass.getInstance(results[i]));
          this.length++;
        }
        resolve(this);
      });
    });
  }
  toJSON() {
    let ret = [];
    this.models.forEach((model) => {
      ret.push(model.attributes);
    });
    return ret;
  }
  at(i) {
    if (i <= this.models.length - 1) {
      return this.models[i];
    } else {
      return [];
    }
  }
  on(event, handler) {
    this.collectionEmitter.on(event, handler);
  }
}