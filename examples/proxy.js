// Generated by CoffeeScript 1.9.2
var Redwire, options, redwire;

Redwire = require('../');

options = {
  http: {
    port: 8081
  },
  http2: {
    port: 8082,
    key: '/Users/tcoats/MetOcean/tugboat/harmony/metoceanview.com.key',
    cert: '/Users/tcoats/MetOcean/tugboat/harmony/metoceanview.com.crt'
  }
};

redwire = new Redwire(options);

redwire.http('localhost:8081').use(redwire.proxy('http://localhost:8080'));

redwire.http2('localhost:8082').use(redwire.proxy('http://localhost:8080'));
