var util = require('util'),
    extend = require('node.extend'),
    log = require('./log.js'),
    EventEmitter = require('events').EventEmitter,
    GraphiteHost = require('./graphiteHost.js').GraphiteHost;


function GraphiteGroup(graphite, options) {
    var self = this;

    var defaults = {
        "label": undefined,
        "id": undefined,
        "hosts": {}
    };
    options = extend(true, defaults, options );

    self.graphite = graphite;
    self.id = options.id;
    self.hosts = [];
    self.sub_groups = {};
    self.createHosts(options.hosts);
}
util.inherits(GraphiteGroup, EventEmitter);

GraphiteGroup.prototype.createHosts = function(hosts) {
    var self = this;
    for (var id in hosts){
        var parent_group = self;

        // Auto-create sub-groups
        var split = id.split('-');
        if (split.length > 1) {
            var group_name = split[0];
            if (typeof self.sub_groups[group_name] == 'undefined') {
                var new_group = new GraphiteGroup(self.graphite, {
                    "label": group_name,
                    "id": self.id+group_name+'.'
                });
                self.sub_groups[group_name] = new_group;
            }
            parent_group = self.sub_groups[group_name];
        }

        var host = new GraphiteHost(self.graphite, {
                id: id,
                path: self.id + id,
                label: id,
                group: self,
                metrics: hosts[id]
        });
        parent_group.hosts.push(host);

    }
};
GraphiteGroup.prototype.getHosts = function(){
    return this.hosts;
};
GraphiteGroup.prototype.getSubGroups = function(){
    return this.sub_groups;
};
GraphiteGroup.prototype.listSubGroups = function(){
    var self = this;
    var out = [];
    for(var key in self.sub_groups){
        var group = self.sub_groups[key];
        out.push({
            id: group.id,
            label: group.label
        });
    }
    return out;
};
GraphiteGroup.prototype.listHosts = function(){
    var self = this;
    var out = [];
    for (var i in self.hosts){
        out.push({
            id: self.hosts[i].id,
            label: self.hosts[i].label,
        });
    }
    return out;
};


exports.GraphiteGroup = GraphiteGroup;
