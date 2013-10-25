var https = require('https'),
    http = require('http'),
    util = require('util'),
    extend = require('node.extend'),
    log = require('./log.js'),
    EventEmitter = require('events').EventEmitter;

function GraphiteConnector(options) {
    var self = this;
    var defaults = {
        scheme: 'http',
        host: '127.0.0.1',
        port: 80
    };
    this.options = extend(defaults, options);
}

exports.GraphiteConnector = GraphiteConnector;

GraphiteConnector.prototype._getURL = function(url, cb){
    var self = this;
    var scheme = (self.options.scheme == 'http') ? http : https;
    log.info('Requesting API URL: '+url);
    scheme.get(
        {
            host: self.options.host,
            port: self.options.port,
            path: url,
        },
        function(res){
            if (res.statusCode != 200) {
                log.warn('Invalid API response: status code: ' + res.statusCode);
                cb(false, res);
                return;
            }
            var buffer = '';

            res.addListener('data', function(chunk) {
                buffer += chunk.toString('utf8');
            });
            res.addListener('end', function() {
                var obj;
                try {
                    obj = JSON.parse(buffer);
                } catch (e) {
                    log.warn('Invalid API response: parse error: ' + e);
                    cb(false, res);
                }
                cb(obj, res);
            });

        }
    ).on('error', function(e) {
        log.warn('Invalid HTTP response: parse error: ' + e.message);
        cb(false);
    });
};

GraphiteConnector.prototype.getIndex = function(cb) {
    var self = this;

    var url = '/metrics/index.json';
    self._getURL(url, function(data, res){
        cb(data);
    });

};

GraphiteConnector.prototype.callTree = function(query, cb) {
    var self = this;

    var url = '/metrics/find/?format=treejson&query='+query;
    self._getURL(url, function(data, res){
        cb(data);
    });

};