var Graph = function(id, opts){
    var self = this;
    this.id = id;

    var defaults = {
        graphOpts:{
            width: 500,
            height: 300,
            title: '',
            hideLegend: true,
            target:[],
            minorY: 0,
            areaAlpha: 0.8,
            format: 'png',
            from: '-24hours',
            areaMode: 'stacked',
            template: 'default'
        }
    };
    self.opts = $.extend(true, defaults,opts);

    this.appendOpt = function( obj, k ){
        k = k || '';
        for (var key in obj) {
            if( !isNaN(key) && k !== '' ){
                self.url += k +'='+ obj[key] + '&';
            }else if( typeof(obj[key]) == 'string' || !isNaN(obj[key]) ){
                self.url += key +'='+ obj[key] + '&';
            }else{
                self.appendOpt( obj[key], key );
            }
        }
    };
    self.buildSrc = function(){
        self.url = self.opts.renderURL+'?';
        self.appendOpt(self.opts.graphOpts);
        return self.url;
    };

    this.img = $('<img id="'+self.id+'">')
        .css({width: self.opts.graphOpts.width, height: self.opts.graphOpts.height})
        .attr('src', self.buildSrc() )
        .one('load',function(){
            $(this).click(self.zoom);
        });

    this.zoom = function(e){
        if(e){ e.preventDefault(); }

        $('#overlay').toggle();
        if( self.img.hasClass('zoom') ){
            //in
            self.opts.graphOpts.width = self.opts.width;
            self.opts.graphOpts.height = self.opts.height;
            self.img.one('load',function(){
                self.img.toggleClass('zoom')
                    .css({width: self.opts.graphOpts.width, height: self.opts.graphOpts.height});
            }).attr('src', self.buildSrc() );

        }else{
            //out
            self.opts.width = self.opts.graphOpts.width;
            self.opts.height = self.opts.graphOpts.height;
            self.opts.graphOpts.width = Math.round($(window).width() / 100 * 80);
            self.opts.graphOpts.height =  Math.round($(window).height() / 100 * 80);

            self.img.one('load',function(){
                self.img.toggleClass('zoom')
                    .css({width: self.opts.graphOpts.width, height: self.opts.graphOpts.height});
            }).attr('src', self.buildSrc() );
        }
        //shake it all about
    };

    this.setTime = function(t){
        self.opts.graphOpts.from = t;
        self.img.attr( 'src', self.buildSrc() );
    };
};
var GraphGroup = function(graphite, id, host, templates, cb){
    var self = this;
    this.ready = false;
    this.id = id;
    this.host = host;
    this.templates = templates;
    this.dom = {};
    this.dom.div = $('<div id="'+self.id+'"/>').addClass('graphGroup');
    this.dom.header = $('<div class="fluid-row"/>').appendTo(self.dom.div);
    this.dom.header.html('<a href="#'+self.id+'"><h2>'+self.id+'</h2></a>').addClass('toggle');


    this.graphite = graphite;
    this.graphs = [];


    this.toggleGroup = function(e){
        e.preventDefault();
        window.history.pushState({'action': 'graphGroupToggle', id: self.id}, self.id, document.location.pathname+'#'+self.id);
        $(this).siblings().toggle();
    };


    this.render = function(){
        if( self.ready ){
            self._render();
        }else{
            log('welp');
            //setTimeout(self.render(), 1000);
        }
        if( self.graphs.length !== 0){
            return self.dom.div;
        }
    };
    this._render = function(){
        if( self.graphs.length === 0){
            return;
        }
        self.dom.header.click(self.toggleGroup);

        for (var i = 0; i < self.graphs.length; i++) {
            if( i%2 === 0){
                row = self.addRow(self.dom.div);
            }
            row.append( self.graphs[i].img );
        }
    };
    this.addRow = function( parent ){
        return $('<div class="fluid-row"/>').appendTo(parent);
    };
    this.buildGraphs = function( templates, cb ){
        //not generated the graphs yet
        var length = Object.keys(templates).length;
        var i = 0;
        for (var key in templates) {
            if (self.graphite.from !== '') {
                templates[key].from = self.graphite.from;
            }
            if (self.graphite.until !== '') {
                templates[key].until = self.graphite.until;
            }
            templates[key].title = self.host.name + ' - '+templates[key].title;
            doStuff(self.id+'_'+key, templates[key], count);
        }
        function count(){
            i++;
            if( i == length){
                cb();
            }
        }
        function doStuff( id, tpl, cb ){
            if( typeof(tpl.depends) == 'string' && !self.checkDependency(tpl.depends) ){
                //graph depends on a metric that this host doesnt have
                cb();
                return;
            }
            if( typeof(tpl.multi) != 'undefined' ){
                //create multiple graphs from every sub-metric under this node
                self.pushMultiGraph(id, tpl, self.getMetricNodes(tpl.multi.source));
                cb();
                return;
            }
            self.pushGraph(id, tpl);
            cb();
        }
    };
    this.getMetricNodes = function(node){
        var parts = node.split('.');
        var metrics = self.host.metrics;
        for (var i = 0; i < parts.length-1; i++) {
            var p = parts[i];
            if (typeof metrics[p] == 'undefined'){
                return false;
            }
            metrics = metrics[p];
        }
        return Object.keys(metrics);
    };
    this.removeNode = function( regex, nodes ){
        var tmp = [];
        for (var j = 0; j < nodes.length; j++) {
            if( !regex.test(nodes[j]) ){
                tmp.push(nodes[j]);
            }
        }
        return tmp;
    };
    this.pushMultiGraph = function(id, tpl, nodes ){
        tpl.multi.filter = tpl.multi.filter || [];
        tpl.multi.filter = (typeof(tpl.multi.filter) == 'object') ? tpl.multi.filter : [tpl.multi.filter];
        var tmp;
        var i;
        var j;
        //filter out any nodes we dont want
        if( tpl.multi.filter.length > 0){
            tmp = nodes;
            for (i = 0; i < tpl.multi.filter.length; i++) {
                tmp = self.removeNode( new RegExp(tpl.multi.filter[i]), tmp );
            }
            nodes = tmp;
        }

        if( tpl.multi.merge ){
            //all metrics on 1 graph!
            tmp = tpl.target;
            tpl.target = [];
            for (i = 0; i < nodes.length; i++) {
                for (j = 0; j < tmp.length; j++) {
                    tpl.target.push( tmp[j].replace(/%NODEID%/g,nodes[i]) );
                }
            }
            self.pushGraph(id, tpl);
        }else{
            //1 graph per metric
            for (i = 0; i < nodes.length; i++) {
                tmp = clone(tpl);
                for (j = 0; j < tmp.target.length; j++) {
                    tmp.target[j] = tmp.target[j].replace(/%NODEID%/g,nodes[i]);
                }
                self.pushGraph(id+'_'+j, tmp);
            }
        }
    };
    this.pushGraph = function(id,  tpl ){
            delete tpl.depends;
            var aggregated  = (self.host instanceof HostGroup);
            var id_str = (aggregated) ? self.host.id+'*' : self.host.id;

            var agg_func = '';
            if (aggregated && tpl.aggregate) {
                switch (tpl.aggregate){
                    case 'sum':
                        agg_func = 'sumSeries';
                    break;

                    case 'avg':
                    default: // fallthrough
                        agg_func = 'averageSeries';
                    break;
                }
            }

            for (var j = 0; j < tpl.target.length; j++) {
                if (aggregated && tpl.aggregate) {
                    tpl.target[j] = agg_func +'('+tpl.target[j].replace(/%HOSTID%/g, id_str)+')';


                } else {
                    tpl.target[j] = tpl.target[j].replace(/%HOSTID%/g, id_str);
                }
            }
            self.graphs.push( new Graph(id, {renderURL: self.graphite.renderurl, graphOpts: tpl}) );
    };
    this.checkDependency = function( dep ){
        var parts = dep.split('.');
        var metrics = self.host.metrics;
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (typeof metrics[p] == 'undefined'){
                return false;
            }
            metrics = metrics[p];
        }
        return true;
    };

    this.processNodes = function( nodes, status, cb ){
        if( status != 'success'){
            log('failed to get node data');
            return;
        }
        var temp = [];
        for (var i = 0; i < nodes.length; i++) {
            temp.push(nodes[i].text);
        }
        cb(temp);
    };
    this.init = function(cb){
        self.buildGraphs( self.templates, function(){ self.ready = true; cb(); } );
    };
    this.init(cb);
};