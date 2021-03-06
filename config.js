'use strict';
var fs = require('fs');
var utils = require('./utils');
var path = require('path');

let config = {
  log: {
    file: path.resolve(__dirname + '/' + process.env.LOGFILE),
    level: process.env.LOGLEVEL
  },
  analytics: {
    enabled: true
  },
  screener: {
    max: 5
  },
  timeouts: {
    trade: 200
  },
  google: {
    oauth_token: JSON.parse(process.env.GOOGLE_OAUTH_TOKEN),
    oauth_client: JSON.parse(process.env.GOOGLE_OAUTH_CLIENT)
  },
  trading: {
    spread: {
      min: 0,
      max: 0.5,
      moving_average_period: 10
    },
    strategies: {
      minStopMargin: 0.001,
      c: 1.25
    }
  },
  sweeper: {
    retries: 5,
    interval: 5000
  },
  ajax: {
    fetch: {
      options: {
        method: 'get',
        auth: {
          bearer: process.env.TOKEN
        },
        agentOptions: {
          cert: fs.readFileSync(path.join(__dirname, 'ssl', 'groundwire.co.crt')),
          key: fs.readFileSync(path.join(__dirname, 'ssl', 'groundwire.co.key')),
          ca: fs.readFileSync(path.join(__dirname, 'ssl', 'groundwire.co.pem'))
        },
        strictSSL: process.env.STRICT_SSL != 0 ? true : false
      }
    },
    create: {
      options: {
        method: 'post',
        auth: {
          bearer: process.env.TOKEN
        },
        agentOptions: {
          cert: fs.readFileSync(path.join(__dirname, 'ssl', 'groundwire.co.crt')),
          key: fs.readFileSync(path.join(__dirname, 'ssl', 'groundwire.co.key')),
          ca: fs.readFileSync(path.join(__dirname, 'ssl', 'groundwire.co.pem'))
        },
        strictSSL: process.env.STRICT_SSL != 0 ? true : false
      }
    },
    destroy: {
      options: {
        method: 'delete',
        auth: {
          bearer: process.env.TOKEN
        },
        agentOptions: {
          cert: fs.readFileSync(path.join(__dirname, 'ssl', 'groundwire.co.crt')),
          key: fs.readFileSync(path.join(__dirname, 'ssl', 'groundwire.co.key')),
          ca: fs.readFileSync(path.join(__dirname, 'ssl', 'groundwire.co.pem'))
        },
        strictSSL: process.env.STRICT_SSL != 0 ? true : false
      }
    }
  },
  user: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/user",
        development: "http://localhost:3000/v1/user"
      },
      secure: {
        required: true,
        key: "key"
      }
    }
  },
  positions: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/positions",
        development: "http://localhost:3000/v1/positions"
      },
      secure: {
        required: true,
        key: "key"
      }
    }
  },
  instrument: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/instrument",
        development: "http://localhost:3000/v1/instrument"
      },
      secure: {
        required: true,
        key: "key"
      },
      defaults: {
        ticker: 'AAPL'
      }
    }
  },
  watchlist: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/watchlist",
        development: "http://localhost:3000/v1/watchlist"
      },
      secure: {
        required: true,
        key: "key"
      }
    }
  },
  price: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/price",
        development: "http://localhost:3000/v1/price"
      },
      secure: {
        required: true,
        key: "key"
      }
    },
    socket: {
      url: {
        production: "https://api.groundwire.co",
        development: "http://localhost:3000"
      },
      secure: {
        required: true,
        key: "key"
      },
      defaults: {
        ticker: 'AAPL'
      }
    }
  },
  trade: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/trade",
        development: "http://localhost:3000/v1/trade"
      },
      secure: {
        required: true,
        key: "key"
      }
    }
  },
  queue: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/queue",
        development: "http://localhost:3000/v1/queue"
      },
      secure: {
        required: true,
        key: "key"
      }
    }
  },
  cancel: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/cancel",
        development: "http://localhost:3000/v1/cancel"
      },
      secure: {
        required: true,
        key: "key"
      }
    }
  },
  accounts: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/accounts",
        development: "http://localhost:3000/v1/accounts"
      },
      secure: {
        required: true,
        key: "key"
      }
    }
  },
  holidays: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/holidays",
        development: "http://localhost:3000/v1/holidays"
      },
      secure: {
        required: true,
        key: "key"
      }
    }
  },
  orders: {
    api: {
      url: {
        production: "https://api.groundwire.co/v1/orders/recent",
        development: "http://localhost:3000/v1/orders/recent"
      },
      secure: {
        required: true,
        key: "key"
      }
    }
  },
  msn: {
    api: {
      url: {
        production: "https://www.msn.com/en-us/money/getfilterresponse",
        development: "https://www.msn.com/en-us/money/getfilterresponse"
      },
      secure: {
        required: false
      },
      query: {
        filters: "DiffYlDl|Yes~StkTyp|Classic Growth;Slow Growth~Country|USA",
        ranges: "RtCap|0;8359~Mc|500000000;762600000000~Dh|25;75~Dl|25;75",
        sortedby: "Mc",
        sortorder: "DESC",
        count: 20,
        offset: 0,
        market: "USA",
        sectype: "Stock",
        ver: "2.0.6379.289"
      }
    }
  }
}

module.exports.get = function(path) {
  let params = path.indexOf(',') !== -1 ? path.split(',') : [path];
  var ret = utils.parseObjectPath(params[0], config);
  if (params.length > 1) {
    var searchRx;
    for (var i=1; i<params.length; i++) {
      searchRx = new RegExp('(\\$t)(' + i + ')');
      ret = ret.replace(searchRx, params[i]);
    }
  }
  return ret;
}