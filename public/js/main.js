var Graphite = function(options) {
    var self = this;

    this.socket = io.connect();
    this.hostGroups ={};
    this.templates = templates; // Bootstrapped in to the html serverside
    this.groups = {};
    this.hosts = {};
    this.activeHost = null;
    this.from = '';
    this.until = '';

    self.renderurl = 'http://graphite.squiz.co.uk/render/';

    this.nav = $('#hostlist');
    this.body = $('#body');
    this.hostsearch = $('#hostsearch');
    this.title = $('#title');
    this.innerTitle = this.body.children('h2');
    this.intervalForm = $('#interval');
    this.setrelative = $('#setrelative');
    this.setabsolute = $('#setabsolute');

    self.relativeUnit = 'h';
    self.relativeVal = 24;


    this.resizeNav = function(){
        var nav = $('#nav');
        var wH = $(window).height();
        var bP = $('body').css('padding-top');
        bP = bP.substr(0, bP.length-2);
        nav.height(wH-bP);
    };
    self.resizeNav();
    $(window).on('resize', function(){
        resizeNav();
    });

    this.socket.on('connect',function(){
        self.socket.emit('getHostGroups', '', self.init);
    });
    this.init = function(groups) {
        self.hostGroups = groups;
        self.buildNav();
        self.bindNav();

        self.initInterval();

        window.onpopstate = self.route;
        self.route();

    };

    this.buildNav = function() {
        self.nav.children().remove();
        self._buildNav({groups: clone(self.hostGroups)}, '', self.nav);
    };

    this._buildNav = function(group, label, el){
        var group_id  = group['_id'] || '.';
        group_id = group_id.substr(0, group_id.length-1);
        var li;
        var ul;

        if (typeof group['groups'] == 'object'){

            for (var key in group['groups']){
                if (key == '_id') { continue; }
                var id = group['groups'][key]['_id'];
                id = id.substr(0, id.length-1);

                if (typeof self.groups[id] == 'undefined'){
                    self.groups[id] = new HostGroup(self, {
                        id: id,
                        name: key
                    });
                }

                var sub_hosts = group['groups'][key]['hosts'] || [];
                var sub_groups = group['groups'][key]['groups'] || {};
                var len = Object.keys(sub_groups).length + sub_hosts.length;

                li = $(self.templates.nav_group({id: id, label: key, len: len}));

                ul = li.children('ul');
                self._buildNav(group['groups'][key], key, ul);
                el.append(li);
            }
        }
        if (group['hosts'] instanceof Array) {
            for (var i in group['hosts']) {
                var host = group['hosts'][i];
                var html = $(self.templates.nav_host_li(host));

                self.hosts[host.id] = new Host(self, {
                    id: host.id,
                    name: host.label
                });
                if (typeof self.groups[group_id] == 'undefined'){
                    self.groups[group_id] = new HostGroup(self, {
                        id: group_id,
                        name: label
                    });
                }
                self.groups[group_id].push(self.hosts[host.id]);
                el.append(html);
            }
        }
    };

    this.bindNav =function(){
        var nav = self.nav;
        nav.find('ul').hide();
        nav.children('li').find('a').click(function(e){
            e.preventDefault();
            self.load($(this).attr('href'), $(this).text());
        });
    };
    self.load = function(path, title){
        if (path == self.activePath) {
            // already there
            return;
        }
        log('Loading: '+path);
        self.activePath = path;
        window.history.pushState(
            {path: path},
            title,
            path+document.location.search
        );

        if (document.location.search !== '') {
            self.parseQueryString(document.location.search);
            self.setFormVals();
        }

        var regex = /^\/(host|group)\/([^\/]+)/;
        var matches = path.match(regex);
        if (matches.length == 1){
            // fail
            log('fail route');
            return;
        }
        if (matches[1] == 'host') {
            self.loadHost(matches[2]);
        }else if (matches[1] == 'group') {
            self.loadGroup(matches[2]);
        }

    };
    self.parseQueryString = function(query){
        query = query.substr(1); // remove ?
        var split = query.split('&');
        for (var i = 0; i < split.length; i++) {
            var param = split[i].split('=');
                        if (param.length > 1) {
                if (param[0] == 'from') {
                    self.from = param[1];
                } else if (param[0] == 'until') {
                    self.until = param[1];
                }
            }
        }
        log('from: '+self.from);
        log('until: '+self.until);
    };
    self.loadHost = function(host){
        if (typeof self.hosts[host] != 'undefined') {
            self.active = self.hosts[host];
            self.hosts[host].load();
        }
    };
    self.loadGroup = function(group){
        if (typeof self.groups[group] != 'undefined') {
            self.active = self.groups[group];
            self.groups[group].load();
        }
    };
    self.route = function(e){
        log(e);

        //find host
        var host;
        var path = document.location.pathname;
        self.load(path, path);
    };

    self.initInterval = function(){
        $('#relative').change(self.setRelativeInterval);
        $('#relativeUnit').siblings('ul').find('a').click(function(e){
            e.preventDefault();
            $('#relativeUnit .unit').text($(this).text());
            self.setRelativeUnit($(this).attr('unit'));
        });

        self.setabsolute.click(self.setAbsoluteInterval);
    };
    self.setFormVals = function (){
        var from = self.from;
        var until = self.until;

        if (from.length == 14) {
            // Absolute date format
            var split = from.split('_');
            var from_t = split[0];
            var from_d = split[1];
            var y = from_d.substr(0,4);
            var m = from_d.substr(4,2);
            var d = from_d.substr(6,2);
            $('input[name="from_d"]').val(y+'-'+m+'-'+d);
            $('input[name="from_t"]').val(from_t);
        }else{
            // relative format
            $('input[name="from_d"]').val('');
            $('input[name="from_t"]').val('');
            $('input[name="until_d"]').val('');
            $('input[name="until_t"]').val('');

            $('#relative').val(self.from.slice(1,self.from.length-1));
            var unit = self.from.substr(self.from.length-1);
            switch (unit) {
                case 'h':
                    unit = 'Hours';
                break;
                case 'mins':
                    unit = 'Minutes';
                break;
                case 'd':
                    unit = 'Days';
                break;
                case 's':
                    unit = 'Seconds';
                break;
            }
            $('#relativeUnit').children('.unit').text(unit);
        }
        if (until.length == 14) {
            // Absolute date format
            var split = until.split('_');
            var until_t = split[0];
            var until_d = split[1];
            var y = until_d.substr(0,4);
            var m = until_d.substr(4,2);
            var d = until_d.substr(6,2);
            $('input[name="until_d"]').val(y+'-'+m+'-'+d);
            $('input[name="until_t"]').val(until_t);
        }
    };
    self.setAbsoluteInterval = function(e){
        if (e) {
            e.preventDefault();
        }
        // 00:00_20131021
        var form  = self.intervalForm;
        var from_d = form.find('input[name="from_d"]').val().replace(/-/g,'');
        var from_t = form.find('input[name="from_t"]').val();
        var until_d = form.find('input[name="until_d"]').val().replace(/-/g,'');
        var until_t = form.find('input[name="until_t"]').val();

        if (until_d !== '') {
            self.until = until_t+'_'+until_d;
        }
        if (from_d !== '') {
            self.from = from_t+'_'+from_d;
        }
        self.active.refresh();
        window.history.pushState(
            {path: self.activePath},
            self.active.name,
            self.activePath+'?from='+self.from+'&until='+self.until
        );
    };

    self.setRelativeInterval = function(e){
        if (e) {
            e.preventDefault();
        }
        var val = $('#relative').val();
        self.relativeVal = val;
        self.from = '-'+self.relativeVal+self.relativeUnit;
        self.until = '';
        self.active.refresh();
        window.history.pushState(
            {path: self.activePath},
            self.active.name,
            self.activePath+'?from='+self.from+'&until='+self.until
        );
    };
    self.setRelativeUnit = function(unit){
        self.relativeUnit = unit || 'h';
        self.setRelativeInterval();
    };

};

//clone object
function clone(obj) {
    var tmp = (obj instanceof Array) ? [] : {};
    for (var i in obj) {
        tmp[i] = ( typeof(obj[i]) === 'object' ) ? clone(obj[i]) : obj[i];
    }
    return tmp;
}
//js string functions are awful
String.prototype.padLeft = function(num, chr){
    var str = this.toString();
    if( str.length >= num ){
        return str;
    }
    for( i=num; i>=str.length; i-- ){
        str = chr+str;
    }
    return str;
};
var debug = true;
function log(msg){
    debug = debug || false;
    if( debug && typeof(console) == 'object' ){
        if( typeof(msg) == 'string' ){
            var d = new Date();
            var timestamp = d.getDate().toString().padLeft(2,0) +
                            '-'+(d.getMonth()+1).toString().padLeft(2,0) +
                            '-'+d.getFullYear().toString().padLeft(2,0) +
                            ' '+d.getHours().toString().padLeft(2,0) +
                            ':'+d.getMinutes().toString().padLeft(2,0) +
                            ':'+d.getSeconds().toString().padLeft(2,0);
            console.log(timestamp+' - '+msg);
        }else{
            console.log(msg);
        }

    }
}
