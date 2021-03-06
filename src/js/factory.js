/* global myApp, StellarSdk */

myApp.factory('SettingFactory', function($window) {
  return {
    // To add new preset network, add new entry here and in `translationKey` to all translations.
    // P.S. Undefined entries will be asked for in user interface.
    NETWORKS: {
      xmcc: {
        name: "Monoeci Public Network",
        translationKey: 'public_url',
        networkType: 'xmcc',
        networkPassphrase: "Monoeci Main Network ; Novembre 2018",
        knownHorizons: [
          'https://api.monoeci.io'  // First one is default.
        ],
        coin: {
          name: "monoeci",
          atom: "stroop",
          code: "XMCC",
          logo: "img/monoeci.png",
          bip44: 148,
        },
        allowHTTP: false,
        tabs: ["history", "trade", "balance", "send", "trust", "service", "ico", "signoffline"]
      },
      xmccTest: {
        name: "Monoeci Test Network",
        translationKey: 'test_url',
        networkType: 'xmccTest',
        networkPassphrase: "Monoeci Test Network ; Novembre 2018",
        knownHorizons: [
          'https://api-testnet.monoeci.io',
        ],
        coin: {
          name: "monoeci",
          atom: "stroop",
          code: "XMCC",
          logo: "img/monoeci.png",
          bip44: 148,
        },
        allowHTTP: true,
        tabs: ["history", "trade", "balance", "send", "trust", "signoffline"]
      },
      other: {
        name: "User defined",
        translationKey: 'other_url',
        networkType: 'other',
        networkPassphrase: undefined,
        knownHorizons: [
        ],
        coin: {
          name: "lumen",  // TODO: ask in settings
          atom: "stroop",  // TODO: ask in settings
          code: undefined,
          logo: "img/rocket.png",  // TODO: ask in settings
          bip44: 148,
        },
        allowHTTP: true,
        tabs: ["history", "trade", "balance", "send", "trust", "signoffline"]
      }
    },
    setLang : function(lang) {
      return $window.localStorage['lang'] = lang;
    },
    getLang : function() {
      if ($window.localStorage['lang']) {
        return $window.localStorage['lang'];
      } else {
      //   if (nw.global.navigator.language.indexOf('zh') >= 0) {
      //     return 'cn';
      //   } else if (nw.global.navigator.language.indexOf('fr') >= 0) {
      //     return 'fr';
      //   } else {
        return 'en';
      // }
      }
    },

    setProxy : function(proxy) {
      return $window.localStorage[`proxy`] = "undefined" === proxy ? '' : proxy;
    },
    getProxy : function() {
      return $window.localStorage[`proxy`] || "";
    },

    setNetworkType : function(network) {
      return $window.localStorage[`network_type`] = network in this.NETWORKS ? network : 'xmcc';
    },
    getNetworkType : function() {
      return $window.localStorage[`network_type`] || this.setNetworkType();
    },
    getCurrentNetwork : function() {
      var network = this.NETWORKS[this.getNetworkType()];
      if (this.getNetworkType() === 'other') {
        network.coin.code = this.getCoin();
      }
      return network;
    },
    setMonoeciUrl : function(url) {
      return $window.localStorage[`network_horizon/${this.getNetworkType()}`] = url;
    },
    getMonoeciUrl : function(type) {
      type = type || this.getNetworkType();
      return $window.localStorage[`network_horizon/${type}`] || this.NETWORKS[type].knownHorizons[0];
    },
    setNetPassphrase : function(val) {
      return this.getNetworkType() === 'other' ? $window.localStorage[`network_passphrase/${this.getNetworkType()}`] = val : this.NETWORKS[this.getNetworkType()].networkPassphrase;
    },
    getNetPassphrase : function(type) {
      return this.getNetworkType() === 'other' ? $window.localStorage[`network_passphrase/${type || this.getNetworkType()}`] : this.NETWORKS[this.getNetworkType()].networkPassphrase;
    },
    setCoin : function(val) {
      return this.getNetworkType() === 'other' ? $window.localStorage[`network_coin/${this.getNetworkType()}`] = val : this.NETWORKS[this.getNetworkType()].coin.code;
    },
    getCoin : function(type) {
      return this.getNetworkType() === 'other' ? $window.localStorage[`network_coin/${type || this.getNetworkType()}`] : this.NETWORKS[this.getNetworkType()].coin.code;
    },
    getAllowHttp : function() {
      return this.NETWORKS[this.getNetworkType()].allowHTTP;
    },

    setFedNetwork : function(domain) {
      $window.localStorage['fed_network'] = domain;
    },
    getFedNetwork : function(url) {
      return $window.localStorage['fed_network'] || 'fed.monoeci.io';
    },
    setFedRipple : function(domain) {
      $window.localStorage['fed_ripple'] = domain;
    },
    getFedRipple : function(url) {
      return $window.localStorage['fed_ripple'] || 'ripplefox.com';
    },
    setFedBitcoin : function(domain) {
      $window.localStorage['fed_bitcoin'] = domain;
    },
    getFedBitcoin : function(url) {
      return $window.localStorage['fed_bitcoin'] || 'naobtc.com';
    },

    getTradepair : function() {
      if ($window.localStorage['tradepair']) {
        return JSON.parse($window.localStorage['tradepair']);
      } else {
        return {
          base_code   : this.getCurrentNetwork().coin.code,
          base_issuer : '',
          counter_code   : 'CNY',
          counter_issuer : 'GAREELUB43IRHWEASCFBLKHURCGMHE5IF6XSE7EXDLACYHGRHM43RFOX'
        }
      }
    },
    setTradepair : function(base_code, base_issuer, counter_code, counter_issuer) {
      var trade_pair = {
        base_code   : base_code,
        base_issuer : base_issuer,
        counter_code   : counter_code,
        counter_issuer : counter_issuer
      }
      $window.localStorage['tradepair'] = JSON.stringify(trade_pair);
    },

    getBridgeService : function() {
      return $window.localStorage['bridge_service'] || 'ripplefox.com';
    },
    setBridgeService : function(anchor_name) {
      $window.localStorage['bridge_service'] = anchor_name;
    }
  };
});

myApp.factory('FedNameFactory', function(SettingFactory, MonoeciApi) {
  var fed = {
    map : {}
  };

  fed.isCached = function(address) {
    return this.map[address] ? true : false;
  };

  fed.getName = function(address) {
    return this.map[address].nick;
  };

  fed.resolve = function(address, callback) {
    var self = this;

    if (!self.map[address]) {
      self.map[address] = {
        address : address,
        nick    : ""
      }
    } else {
      return callback(new Error("resolving " + address), null);
    }

    MonoeciApi.getFedName(SettingFactory.getFedNetwork(), address, function(err, name){
      if (err) {
        console.error(address, err);
      } else {
        self.map[address].nick = name;
      }
      return callback(null, self.map[address])
    });
  };

  return fed;
});

myApp.factory('RemoteFactory', function($http) {
  var remote = {};

  function getResource(url, callback){
    console.debug('GET: ' + url);
    $http({
      method: 'GET',
      url: url
    }).then(function(res) {
      if (res.status != "200") {
        callback(res, null);
      } else {
        callback(null, res.data);
      }
    }).catch(function(err) {
      callback(err, null);
    });
  }

  // Poor network in China, need a backup data source
  remote.getIcoAnchors = function(callback) {
    var url = 'https://monoecichat.github.io/ico/data/anchor.json';
    var backup = 'https://ico.monoeci.chat/data/anchor.json';

    getResource(url, function(err, data) {
      if (err) {
        console.error(err);
        getResource(backup, function(err, data){
          return callback(err, data);
        });
      } else {
        return callback(null, data);
      }
    });
  };

  remote.getIcoItems = function(callback) {
    var url = 'https://monoecichat.github.io/ico/data/ico.json';
    var backup = 'https://ico.monoeci.chat/data/ico.json';

    getResource(url, function(err, data) {
      if (err) {
        console.error(err);
        getResource(backup, function(err, data){
          return callback(err, data);
        });
      } else {
        return callback(null, data);
      }
    });
  };

  remote.getMonoeciTicker = function(callback) {
    //var url = 'http://ticker.monoeci.org/';
    var url = 'https://api.monoeciterm.com/v1/ticker.json';
    getResource(url, callback);
  }

  remote.getClientVersion = function(callback) {
    var url = "https://raw.githubusercontent.com/monoeci-monaco/monoeci-desktop-client/master/src/package.json";
    getResource(url, callback);
  }
  return remote;
});

myApp.factory('AnchorFactory', ['$rootScope', 'MonoeciApi',
  function($scope, MonoeciApi) {
    var obj = {
      anchor : {
        'ripplefox.com' : {domain  : 'ripplefox.com', parsing : false, parsed  : false}
      },
      address : {
        'GAREELUB43IRHWEASCFBLKHURCGMHE5IF6XSE7EXDLACYHGRHM43RFOX' : {domain : 'ripplefox.com', parsing: false, parsed: false}
      }
    };

    obj.isAnchorParsed = function(domain) {
      return this.anchor[domain] && this.anchor[domain].parsed;
    }
    obj.isAccountParsed = function(address) {
      return this.address[address] && this.address[address].parsed;
    }
    obj.getAnchor = function(domainOrAddress) {
      var domain = domainOrAddress;
      if (this.address[domainOrAddress]) {
        domain = this.address[domainOrAddress].domain;
      }
      return this.anchor[domain];
    }

    obj.addAnchor = function(domain) {
      var self = this;
      if (!self.anchor[domain]) {
        self.anchor[domain] = {domain  : domain, parsing : false, parsed  : false};
      }
      if (!self.anchor[domain].parsed) {
        self.parseDomain(domain);
      }
    }

    obj.addAccount = function(address) {
      var self = this;
      if (!self.address[address]) {
        self.address[address] = {domain  : null, parsing : false, parsed  : false};
      }
      if (!self.address[address].parsed) {
        self.parseAccount(address);
      }
    }

    obj.parseAccount = function(address) {
      var self = this;
      if (self.address[address].parsing) {
        return;
      }

      console.debug('Parse domain of ' + address);
      self.address[address].parsing = true;
      MonoeciApi.getInfo(address, function(err, data) {
        self.address[address].parsing = false;
        if (err) {
          console.error(err);
        } else {
          self.address[address].parsed = true;
          if (data.home_domain) {
            console.debug(address, data.home_domain);
            self.address[address].domain = data.home_domain;
            self.addAnchor(data.home_domain);
          } else {
            console.debug(address + ' home_domain not set.');
          }
        }
      });
    }

    obj.parseDomain = function(domain) {
      var self = this;
      if (self.anchor[domain].parsing) {
        return;
      }

      console.debug('Parse monoeci.toml of ' + domain);
      self.anchor[domain].parsing = true;
      StellarSdk.StellarTomlResolver.resolve(domain).then(function(monoeciToml) {
        console.debug(domain, monoeciToml);
        self.anchor[domain].parsing = false;
        self.anchor[domain].parsed = true;
        self.anchor[domain].toml = monoeciToml;
        self.anchor[domain].deposit_api = monoeciToml.DEPOSIT_SERVER;
        self.anchor[domain].fed_api = monoeciToml.FEDERATION_SERVER;

        var currencies = monoeciToml.CURRENCIES;
        currencies.forEach(function(asset){
          if (asset.host && asset.host.indexOf(domain) < 0) {
            //ignore the asset not issued by this domain
            console.warn(domain, asset);
          } else {
            self.address[asset.issuer] = {domain: domain, parsing: false, parsed: true};
          }
        });

        $scope.$broadcast("anchorUpdate");
      }).catch(function(err){
        self.anchor[domain].parsing = false;
        console.error(err);
      });

    }

    return obj;
  } ]);
