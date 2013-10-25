var util = require('util'),
    extend = require('node.extend'),
    log = require('./log.js'),
    EventEmitter = require('events').EventEmitter;


function GraphiteHost(graphite, options) {
    var self = this;

    var defaults = {
        "id": undefined,
        "group": undefined,
        "metrics": {}
    };
    this.options = extend(true, defaults, options );

    self.graphite = graphite;
    self.id = this.options.id;
    self.label = this.options.label;
    self.group = this.options.group;
    self.metrics = this.options.metrics;

}
util.inherits(GraphiteHost, EventEmitter);

GraphiteHost.prototype.listMetrics = function(){
    var self = this;
    return self.metrics;
};

exports.GraphiteHost = GraphiteHost;
