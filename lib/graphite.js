var https = require('https'),
    http = require('http'),
    util = require('util'),
    extend = require('node.extend'),
    log = require('./log.js'),
    EventEmitter = require('events').EventEmitter,
    GraphiteConnector = require('./graphiteConnector.js').GraphiteConnector,
    GraphiteGroup = require('./graphiteGroup.js').GraphiteGroup;

function Graphite(options) {
    var self = this;
    var defaults = {
        "graphite": {},
        "index_update_interval": 600,
        "hostgroups": {
        }
    };
    this.options = extend(true, defaults, options );

    self.api = new GraphiteConnector(options.graphite);
    self.hosts = { };
    self.cron = {};
    self.index = {};
    self.index_updated = false;

    // Always update hostgroups after updating the index
    self.on('index_updated', self.updateHostGroups);
    self.on('index_updated', function(){
        var now = new Date();
        self.index_updated = now.getTime();
    });
    self.on('hostgroups_updated', function(){
        var now = new Date();
        self.hostgroups_updated = now.getTime();
    });

    self.cron.index = setInterval(
        function(){
            self.updateIndex();
        },
        this.options.index_update_interval * 1000
    );
}

util.inherits(Graphite, EventEmitter);

Graphite.prototype.getMetrics = function(host) {
    var self = this;
    var parts = host.split('.');
    var cur_idx = self.index;
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (typeof cur_idx[p] == 'undefined'){
            return false;
        }
        cur_idx = cur_idx[p];
    }
    return cur_idx;
};

Graphite.prototype.getHostGroups = function() {
    var self = this;
    return self._getHostGroups(self.hostGroups);
};

Graphite.prototype._getHostGroups = function(groups) {
    var self = this;
    var out = {};
    for (var g in groups) {
        if (g == '_id'){ continue; }
        if (typeof groups[g]['_id'] == 'string') {
            var sub = self._getHostGroups(groups[g]);
            out[g] = {
                '_id': groups[g]['_id'],
                'groups': sub
            };

        } else {
            var hosts = groups[g].listHosts();
            out[g] = {
                '_id': groups[g].id,
                hosts: []
            };
            for (var i = 0; i < hosts.length; i++) {
                out[g].hosts.push({id: groups[g].id+hosts[i].id, label: hosts[i].label});
            }

            var sub_groups = groups[g].getSubGroups();
            if (Object.keys(sub_groups).length > 0){
                out[g]['groups'] = {};
            }
            for (var sub_key in sub_groups) {
                var temp = {};
                var sg = sub_groups[sub_key];
                temp._id = sg.id;
                temp.hosts = [];
                var sub_hosts =  sg.listHosts();
                for (i = 0; i < sub_hosts.length; i++) {
                    temp.hosts.push({id: groups[g].id+sub_hosts[i].id, label: sub_hosts[i].label});
                }
                out[g].groups[sub_key] = temp;
            }


        }
    }
     return out;
};


Graphite.prototype.updateIndex = function(cb){
    var self = this;
    var hosts = {};
    cb = cb || function(){};
    self.api.getIndex(function(index){
        self._updateIndex(index, cb);
    });
};

Graphite.prototype._updateIndex = function(data, cb){
    var self = this;
    var index = {};
    if (data === false) {
        self.emit('index_failed');
        cb();
        return;
    }
    for (var i = 0; i < data.length; i++) {
        var parts = data[i].split('.');
        var cur_idx = index;

        for (var j = 0; j < parts.length; j++) {
            var part = parts[j];
            if (typeof cur_idx[part] == 'undefined') {
                // New entry!
                cur_idx[part] = {};
            }
            cur_idx = cur_idx[part];
        }

    }
    log.info('Index Updated');
    self.index = index;
    self.emit('index_updated');
    cb();
};

Graphite.prototype.updateHostGroups = function(){
    var self = this;
    var index = self.index;
    var groups = self.options.hostgroups;

    var hostGroups = self._updateHostGroups(groups, index, '');

    self.hostGroups = hostGroups;

    log.info('Host Groups updated');
    self.emit('hostgroups_updated');
    return hostGroups;

};

Graphite.prototype._updateHostGroups = function(groups, hosts, id, split){
    var self = this;
    var out = {};

    for (var group_id in groups) {
        if (group_id == '_label' || group_id == '_split') { continue; }

        var full_id = id+group_id+'.';
        var cur_group = groups[group_id];

        var group_label;
        if (typeof cur_group == 'string') {

            group_label = cur_group;
            if (typeof hosts != 'undefined'){
                var newGroup = new GraphiteGroup(self, {
                    "label": group_label,
                    "id": full_id,
                    "hosts": hosts[group_id],
                    "split": split
                });
                out[group_label] = newGroup;
            }

        } else if (typeof cur_group == 'object' && typeof cur_group['_label'] == 'string') {

            group_label = cur_group['_label'];
            split = (typeof cur_group['_split'] !== 'undefined') ? cur_group['_split'] : true;
            var sub = self._updateHostGroups(cur_group, hosts[group_id], full_id, split);
            out[group_label] = {
                _id: full_id
            };
            for (var key in sub) {
                out[group_label][key] = sub[key];
            }
        }

    }
    return out;
};


exports.Graphite = Graphite;
