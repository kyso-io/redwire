// Generated by CoffeeScript 1.8.0
var CertificateStore, crypto, fs,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

fs = require('fs');

crypto = require('crypto');

module.exports = CertificateStore = (function() {
  function CertificateStore() {
    this._getCertData = __bind(this._getCertData, this);
    this.getTlsOptions = __bind(this.getTlsOptions, this);
    this.getHttpsOptions = __bind(this.getHttpsOptions, this);
    this.isAvailable = __bind(this.isAvailable, this);
    this.add = __bind(this.add, this);
    this._certs = {};
  }

  CertificateStore.prototype.add = function(hostname, options) {
    return this._certs[hostname] = crypto.createCredentials({
      key: this._getCertData(options.key),
      cert: this._getCertData(options.cert),
      ca: this._getCertData(options.ca)
    }).context;
  };

  CertificateStore.prototype.isAvailable = function(hostname) {
    return this._certs[hostname] != null;
  };

  CertificateStore.prototype.getHttpsOptions = function(options) {
    var result;
    result = {
      SNICallback: (function(_this) {
        return function(hostname) {
          return _this._certs[hostname];
        };
      })(this),
      key: this._getCertData(options.key),
      cert: this._getCertData(options.cert)
    };
    if (options.ca) {
      result.ca = [this._getCertData(options.ca)];
    }
    return result;
  };

  CertificateStore.prototype.getTlsOptions = function(options) {
    var result;
    result = {
      key: this._getCertData(options.key),
      cert: this._getCertData(options.cert)
    };
    if (options.ca) {
      result.ca = [this._getCertData(options.ca)];
    }
    return result;
  };

  CertificateStore.prototype._getCertData = function(pathname) {
    var path, _i, _len, _results;
    if (pathname) {
      if (pathname instanceof Array) {
        _results = [];
        for (_i = 0, _len = pathname.length; _i < _len; _i++) {
          path = pathname[_i];
          _results.push(this._getCertData(path));
        }
        return _results;
      } else if (fs.existsSync(pathname)) {
        return fs.readFileSync(pathname, 'utf8');
      }
    }
  };

  return CertificateStore;

})();
