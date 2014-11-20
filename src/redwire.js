// Generated by CoffeeScript 1.8.0
var Bindings, CertificateStore, DispatchNode, LoadBalancer, RedWire, copy, format_url, http, http_proxy, https, parse_url,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

http = require('http');

https = require('https');

http_proxy = require('http-proxy');

parse_url = require('url').parse;

format_url = require('url').format;

DispatchNode = require('./dispatch-node');

CertificateStore = require('./certificate-store');

LoadBalancer = require('./load-balancer');

Bindings = require('./bindings');

copy = function(source, target) {
  var key, value, _results;
  _results = [];
  for (key in source) {
    value = source[key];
    if (typeof value === 'object') {
      if ((target[key] == null) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      _results.push(copy(value, target[key]));
    } else {
      _results.push(target[key] = value);
    }
  }
  return _results;
};

module.exports = RedWire = (function() {
  function RedWire(options) {
    this.close = __bind(this.close, this);
    this.getBindings = __bind(this.getBindings, this);
    this.setBindings = __bind(this.setBindings, this);
    this.createNewBindings = __bind(this.createNewBindings, this);
    this.removeHttpsWs = __bind(this.removeHttpsWs, this);
    this.removeHttpWs = __bind(this.removeHttpWs, this);
    this.removeHttps = __bind(this.removeHttps, this);
    this.removeHttp = __bind(this.removeHttp, this);
    this.httpsWs = __bind(this.httpsWs, this);
    this.httpWs = __bind(this.httpWs, this);
    this.https = __bind(this.https, this);
    this.http = __bind(this.http, this);
    this.redirect302 = __bind(this.redirect302, this);
    this._redirect302 = __bind(this._redirect302, this);
    this.redirect301 = __bind(this.redirect301, this);
    this._redirect301 = __bind(this._redirect301, this);
    this.error500 = __bind(this.error500, this);
    this._error500 = __bind(this._error500, this);
    this.error404 = __bind(this.error404, this);
    this._error404 = __bind(this._error404, this);
    this.proxyWs = __bind(this.proxyWs, this);
    this.proxy = __bind(this.proxy, this);
    this._translateUrl = __bind(this._translateUrl, this);
    this.cors = __bind(this.cors, this);
    this.loadBalancer = __bind(this.loadBalancer, this);
    this.sslRedirect = __bind(this.sslRedirect, this);
    this.setHost = __bind(this.setHost, this);
    this._startProxy = __bind(this._startProxy, this);
    this._startHttps = __bind(this._startHttps, this);
    this._startHttp = __bind(this._startHttp, this);
    this._parseSource = __bind(this._parseSource, this);
    this._options = {
      http: {
        port: 8080,
        websockets: false
      },
      https: false,
      proxy: {
        xfwd: true,
        prependPath: false
      }
    };
    copy(options, this._options);
    this._bindings = this.createNewBindings();
    if (this._options.http) {
      this._startHttp();
    }
    if (this._options.https) {
      this._startHttps();
    }
    if (this._options.proxy) {
      this._startProxy();
    }
  }

  RedWire.prototype._parseSource = function(req) {
    var chunks, source;
    source = parse_url(req.url);
    source.protocol = 'http:';
    source.host = req.headers.host;
    chunks = source.host.split(':');
    source.hostname = chunks[0];
    source.port = chunks[1] || null;
    source.href = "" + source.protocol + "//" + source.host + source.path;
    source.slashes = true;
    return source;
  };

  RedWire.prototype._startHttp = function() {
    this._httpServer = http.createServer((function(_this) {
      return function(req, res) {
        req.source = _this._parseSource(req);
        return _this._bindings._http.exec(req.source.href, req, res, _this._error404);
      };
    })(this));
    if (this._options.http.websockets) {
      this._httpServer.on('upgrade', (function(_this) {
        return function(req, socket, head) {
          req.source = _this._parseSource(req);
          return _this._bindings._httpWs.exec(req.source.href, req, socket, head, _this._error404);
        };
      })(this));
    }
    this._httpServer.on('error', (function(_this) {
      return function(err) {
        return console.log(err);
      };
    })(this));
    return this._httpServer.listen(this._options.http.port || 8080);
  };

  RedWire.prototype._startHttps = function() {
    this.certificates = new CertificateStore();
    this._httpsServer = https.createServer(this.certificates.getServerOptions(this._options.https), (function(_this) {
      return function(req, res) {
        req.source = _this._parseSource(req);
        return _this._bindings._https.exec(req.source.href, req, res, _this._error404);
      };
    })(this));
    if (this._options.https.websockets) {
      this._httpsServer.on('upgrade', (function(_this) {
        return function(req, socket, head) {
          req.source = _this._parseSource(req);
          return _this._bindings._httpsWs.exec(req.source.href, req, socket, head, _this._error404);
        };
      })(this));
    }
    this._httpsServer.on('error', (function(_this) {
      return function(err, req, res) {
        _this._error500(req, res, err);
        return console.log(err);
      };
    })(this));
    return this._httpsServer.listen(this._options.https.port || 8443);
  };

  RedWire.prototype._startProxy = function() {
    this._proxy = http_proxy.createProxyServer(this._options.proxy);
    this._proxy.on('proxyReq', (function(_this) {
      return function(p, req, res, options) {
        if (req.host != null) {
          return p.setHeader('host', req.host);
        }
      };
    })(this));
    return this._proxy.on('error', (function(_this) {
      return function(err, req, res) {
        if (!res.headersSent) {
          return _this._error500(req, res, err);
        }
      };
    })(this));
  };

  RedWire.prototype.setHost = function(host) {
    return (function(_this) {
      return function() {
        var args, mount, next, req, url, _i;
        mount = arguments[0], url = arguments[1], req = arguments[2], args = 5 <= arguments.length ? __slice.call(arguments, 3, _i = arguments.length - 1) : (_i = 3, []), next = arguments[_i++];
        req.host = host;
        return next();
      };
    })(this);
  };

  RedWire.prototype.sslRedirect = function(port) {
    return (function(_this) {
      return function(mount, url, req, res, next) {
        var target;
        target = parse_url(req.url);
        if (port != null) {
          target.port = port;
        }
        if (_this._options.https.port != null) {
          target.port = _this._options.https.port;
        }
        target.hostname = req.source.hostname;
        target.protocol = 'https:';
        res.writeHead(302, {
          Location: format_url(target)
        });
        return res.end();
      };
    })(this);
  };

  RedWire.prototype.loadBalancer = function(options) {
    return new LoadBalancer(options);
  };

  RedWire.prototype.cors = function(allowedHosts) {
    return (function(_this) {
      return function(mount, url, req, res, next) {
        var referer;
        referer = req.headers.referer;
        if (referer == null) {
          return next();
        }
        if (__indexOf.call(allowedHosts, referer) < 0) {
          return next();
        }
        res.setHeader('Access-Control-Allow-Origin', referer);
        res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return next();
      };
    })(this);
  };

  RedWire.prototype._translateUrl = function(mount, target, url) {
    mount = parse_url(mount);
    target = parse_url(target);
    url = parse_url(url);
    return "" + target.pathname + url.path.slice(mount.pathname.length);
  };

  RedWire.prototype.proxy = function(target) {
    return (function(_this) {
      return function(mount, url, req, res, next) {
        var t;
        t = target;
        if ((t != null) && t.indexOf('http://') !== 0 && t.indexOf('https://') !== 0) {
          t = "http://" + t;
        }
        if (t == null) {
          t = req.target;
        }
        if (t == null) {
          return _this._error500(req, res, 'No server to proxy to');
        }
        url = _this._translateUrl(mount, t, url);
        req.url = url;
        return _this._proxy.web(req, res, {
          target: t
        });
      };
    })(this);
  };

  RedWire.prototype.proxyWs = function(target) {
    return (function(_this) {
      return function(mount, url, req, socket, head, next) {
        var t;
        t = target;
        if ((t != null) && t.indexOf('http://') !== 0 && t.indexOf('https://') !== 0) {
          t = "http://" + t;
        }
        if (t == null) {
          t = req.target;
        }
        if (t == null) {
          return _this._error500(req, socket, 'No server to proxy to');
        }
        url = _this._translateUrl(mount, t, url);
        req.url = url;
        return _this._proxy.ws(req, socket, head, {
          target: t
        });
      };
    })(this);
  };

  RedWire.prototype._error404 = function(req, res) {
    var result;
    result = {
      message: "No http proxy setup for " + req.source.href
    };
    res.writeHead(404, {
      'Content-Type': 'application/json'
    });
    res.write(JSON.stringify(result, null, 2));
    return res.end();
  };

  RedWire.prototype.error404 = function() {
    return (function(_this) {
      return function(mount, url, req, res, next) {
        return _this._error404(req, res);
      };
    })(this);
  };

  RedWire.prototype._error500 = function(req, res, err) {
    var result;
    result = {
      message: "Internal error for " + req.source.href,
      error: err
    };
    res.writeHead(500, {
      'Content-Type': 'application/json'
    });
    res.write(JSON.stringify(result, null, 2));
    return res.end();
  };

  RedWire.prototype.error500 = function() {
    return (function(_this) {
      return function(mount, url, req, res, next) {
        return _this._error500(req, res, '');
      };
    })(this);
  };

  RedWire.prototype._redirect301 = function(req, res, location) {
    if (location.indexOf('http://') !== 0 && location.indexOf('https://') !== 0) {
      location = "http://" + location;
    }
    res.writeHead(301, {
      Location: location
    });
    return res.end();
  };

  RedWire.prototype.redirect301 = function(location) {
    return (function(_this) {
      return function(mount, url, req, res, next) {
        return _this._redirect301(req, res, location);
      };
    })(this);
  };

  RedWire.prototype._redirect302 = function(req, res, location) {
    if (location.indexOf('http://') !== 0 && location.indexOf('https://') !== 0) {
      location = "http://" + location;
    }
    res.writeHead(302, {
      Location: location
    });
    return res.end();
  };

  RedWire.prototype.redirect302 = function(location) {
    return (function(_this) {
      return function(mount, url, req, res, next) {
        return _this._redirect302(req, res, location);
      };
    })(this);
  };

  RedWire.prototype.http = function(url, target) {
    return this._bindings.http(url, target);
  };

  RedWire.prototype.https = function(url, target) {
    return this._bindings.https(url, target);
  };

  RedWire.prototype.httpWs = function(url, target) {
    return this._bindings.httpWs(url, target);
  };

  RedWire.prototype.httpsWs = function(url, target) {
    return this._bindings.httpsWs(url, target);
  };

  RedWire.prototype.removeHttp = function(url) {
    return this._bindings.removeHttp(url);
  };

  RedWire.prototype.removeHttps = function(url) {
    return this._bindings.removeHttps(url);
  };

  RedWire.prototype.removeHttpWs = function(url) {
    return this._bindings.removeHttpWs(url);
  };

  RedWire.prototype.removeHttpsWs = function(url) {
    return this._bindings.removeHttpsWs(url);
  };

  RedWire.prototype.createNewBindings = function() {
    return new Bindings(this);
  };

  RedWire.prototype.setBindings = function(bindings) {
    return this._bindings = bindings;
  };

  RedWire.prototype.getBindings = function() {
    return this._bindings;
  };

  RedWire.prototype.close = function(cb) {
    if (this._httpServer != null) {
      this._httpServer.close();
    }
    if (this._httpsServer != null) {
      this._httpsServer.close();
    }
    if (this._proxy != null) {
      this._proxy.close();
    }
    if (cb != null) {
      return cb();
    }
  };

  return RedWire;

})();
