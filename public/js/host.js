var Host = function(graphite, opts){
    var self = this;

    var defaults = {
        id: '',
        name: '',
        group: '',
        graphite: '',
        graphGroups: [],
        metrics: {}
    };
    opts = $.extend( self, defaults, opts );
    this.graphite = graphite;

    this.refresh = function(){
        self.graphGroups = [];
        self.buildGraphs( clone(graphTemplates), self._renderGraph );
    };
    this.renderGraph = function( templates ){
        if( self.graphGroups.length === 0 ){
            self.buildGraphs(templates, self._renderGraph);
        }else{
            self._renderGraph( templates );
        }
    };
    this.buildGraphs = function( templates, cb ){
        //need to get the nodes under this host to check dependencies
        if( Object.keys(self.metrics).length === 0 ){
            self.getMetrics(function(){
                self._buildGraphs( templates, cb );
            });
        }else{
            self._buildGraphs( templates, cb );
        }
    };
    this._buildGraphs = function ( templates, cb ){
        var length = Object.keys(templates).length;
        var i = 0;
        function count(){
            i++;
            if( i == length){
                cb();
            }
        }
        for (var key in templates) {
            self.graphGroups.push( new GraphGroup(self.graphite, key, self, templates[key], count) );
        }
    };
    this.getMetrics = function(cb){
        graphite.socket.emit('getMetrics', self.id, function(metrics){
            if (metrics === false) {
                log('Failed to get metrics for '+self.id);
                cb(false);
                return;
            }
            log('Retrieved metrics for '+self.id);
            self.metrics = metrics;
            cb(true);
        });
    };

    this._renderGraph = function( templates ){
        self.graphite.body.children().remove();

        for (var i = 0; i < self.graphGroups.length; i++) {
            self.graphite.body.append( self.graphGroups[i].render() );
        }

        //browser doesnt take care of this because most of the content is loaded after it attempts to scroll to an anchor
        if( document.location.hash.length > 0 ){
            var hash = document.location.hash.substr(1, document.location.hash.length);
            $.scrollTo('#'+hash);
        }

    };

    this.load = function(){
        graphite.title.text(self.name);
        self.graphite.nav.find('.active').removeClass('active');
        self.nav = self.graphite.nav.find('a[href="/host/'+self.id+'"]').addClass('active');
        self.nav.parents('ul').show().each(function(){
            $(this).siblings('a').addClass('active');
        });

        self.buildGraphs(clone(graphTemplates), self._renderGraph);

    };
};

var HostGroup = function(graphite, opts){
    var self = this;
    this.graphite = graphite;
    var defaults = {
        id: '',
        name: '',
        hosts: [],
        graphGroups: [],
        metrics: {}
    };
    opts = $.extend(self, defaults,opts);


    this.push = function( host ){
        host.group = this;
        this.hosts.push( host );
        return self;
    };

    this.refresh = function(){
        self.graphGroups = [];
        self.buildGraphs( clone(graphTemplates), self._renderGraph );
    };

    this.renderGraph = function( templates ){
        if( self.graphGroups.length === 0 ){
            self.buildGraphs(templates, self._renderGraph);
        }else{
            self._renderGraph( templates );
        }
    };
    this._renderGraph = function( templates ){
        self.graphite.body.children().remove();

        for (var i = 0; i < self.graphGroups.length; i++) {
            self.graphite.body.append( self.graphGroups[i].render() );
        }

        //browser doesnt take care of this because most of the content is loaded after it attempts to scroll to an anchor
        if( document.location.hash.length > 0 ){
            var hash = document.location.hash.substr(1, document.location.hash.length);
            $.scrollTo('#'+hash);
        }

    };
    this.buildGraphs = function( templates, cb ){
        var length = self.hosts.length;
        var i = 0;

        var count = function(){
            i++;
            if( i == length){
                for (var j = 0; j < self.hosts.length; j++) {
                    self.metrics = $.extend(true, self.metrics, self.hosts[j].metrics);
                }
                self._buildGraphs(cb);
            }
        };

        for (var j = 0; j < self.hosts.length; j++) {
            if (Object.keys(self.hosts[j].metrics).length === 0) {
                self.hosts[j].getMetrics(count);
            }else{
                count();
            }
        }
    };
    this._buildGraphs = function ( cb ){
        var tpl = clone(graphTemplates);
        var length = Object.keys(tpl).length;
        var i = 0;
        function count(){
            i++;
            if (i == length) {
                cb();
            }
        }
        for (var key in tpl) {
            self.graphGroups.push( new GraphGroup(self.graphite, key, self, tpl[key], count) );
        }

    };
    this.active = function(){
        self.buildGraphs(clone(graphTemplates),  self._renderGraph);
    };
    this.load = function(){
        self.graphite.title.text(self.name);
        self.graphite.nav.find('.active').removeClass('active');
        self.graphite.nav.find('ul').hide();
        self.nav = self.graphite.nav.find('a[href="/group/'+self.id+'"]').addClass('active');
        self.nav.siblings('ul').show();
        self.nav.parents('ul').show().each(function(){
            $(this).siblings('a').addClass('active');
        });
        self.active();
    };
};
