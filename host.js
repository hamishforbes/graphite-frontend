var Host = function(opts){
	var self = this;

	var defaults = {
		id: '',
		name: '',
		group: '',
		graphite: '',
		graphs: [],
		nodes: []
	};
	opts = $.extend( self, defaults, opts );

	this.renderNav = function(){
		self.nav = $('<li/>');
		$('<a href="hosts/'+self.name+'">'+self.name+'</a>')
			.click(function(e){
				e.preventDefault();
				window.history.pushState({host: self.name }, self.name, '/host/'+self.name);
				self.active();
			})
			.appendTo( self.nav );
		return self.nav;
	};
	this.refresh = function(){
		self.graphs = [];
		self.buildGraphs( clone(graphTemplates), self._renderGraph );
	};
	this.renderGraph = function( templates ){
		if( self.graphs.length === 0 ){
			self.buildGraphs(templates, self._renderGraph);
		}else{
			self._renderGraph( templates );
		}
	};
	this._renderGraph = function( templates ){
		var row;
		main.body.children().remove();
		for (var i = 0; i < self.graphs.length; i++) {
			if( i%2 === 0){
				row = self.addRow(main.body);
			}
			row.append( $('<div class="span6">').append(self.graphs[i].img) );
		}
	};
	this.addRow = function( parent ){
		return $('<div class="fluid-row"/>').appendTo(parent);
	};
	this.buildGraphs = function( templates, cb ){
		//need to get the nodes under this host to check dependencies
		if( self.nodes.length === 0 ){
			self.getNodes(self.id+'.*', function(nodes){
				self.nodes = nodes;
				self._buildGraphs( templates, cb );
			});
		}else{
			self._buildGraphs( templates, cb );
		}
	};
	this._buildGraphs = function( templates, cb ){
		//not generated the graphs yet
		var length = Object.keys(templates).length;
		var i = 0;
		for (var key in templates) {
			if( main.from !== '' ){
				templates[key].from = main.from;
			}
			if( main.until !== '' ){
				templates[key].until = main.until;
			}
			templates[key].title = self.name + ' - '+templates[key].title;
			doStuff(templates[key],count);
		}
		function count(){
			i++;
			if( i == length){
				cb();
			}
		}
		function doStuff( tpl, cb ){
			if( typeof(tpl.depends) == 'string' && !self.checkDependency(tpl.depends) ){
				//graph depends on a metric that this host doesnt have
				cb();
				return;
			}
			if( typeof(tpl.multi) != 'undefined' ){
				//create multiple graphs from every sub-metric under this node
				self.getNodes(self.id+'.'+tpl.multi.source, function(nodes){
					self.pushMultiGraph(tpl, nodes);
					cb();
				});
				return;
			}
			self.pushGraph(tpl);
			cb();
		}
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
	this.pushMultiGraph = function( tpl, nodes ){
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
			self.pushGraph(tpl);
		}else{
			//1 graph per metric
			for (i = 0; i < nodes.length; i++) {
				tmp = clone(tpl);
				for (j = 0; j < tmp.target.length; j++) {
					tmp.target[j] = tmp.target[j].replace(/%NODEID%/g,nodes[i]);
				}
				self.pushGraph(tmp);
			}
		}
	};
	this.pushGraph = function( tpl ){
			delete tpl.depends;
			for (var j = 0; j < tpl.target.length; j++) {
				tpl.target[j] = tpl.target[j].replace(/%HOSTID%/g,self.id);
			}
			self.graphs.push( new Graph(key, {renderURL: self.graphite+'/render', graphOpts: tpl}) );
	};
	this.checkDependency = function( dep ){
		if( self.nodes.indexOf(dep) == -1 ){
			console.log( dep +' not found, skipping graph');
			return false;
		}
		return true;
	};
	this.getNodes = function( node, cb ){
		var url = self.graphite+'/metrics/find/?format=treejson&query='+node;
		$.getJSON(url, function(d,s){
			self.processNodes(d, s, cb);
		});
		//self.processNodes('',false, cb);
	};
	this.processNodes = function( nodes, status, cb ){
		if( status != 'success'){
			console.log('failed to get node data');
			return;
		}
		var temp = [];
		for (var i = 0; i < nodes.length; i++) {
			temp.push(nodes[i].text);
		}
		cb(temp);
	};
	this.active = function(){
		main.reset();
		main.activeHost = self;
		self.nav.addClass('active');
		main.title.text(self.name);
		self.group.active();
		self.renderGraph( clone(graphTemplates), main.body );
	};
};

var Hostgroup = function(opts){
	var self = this;

	var defaults = {
		name: '',
		hosts: []
	};
	opts = $.extend(self, defaults,opts);

	this.push = function( host ){
		host.group = this;
		this.hosts.push( host );
		return self;
	};
	this.renderNav = function(){
		if( self.hosts.length == 1){
			return self.hosts[0].renderNav();
		}
		var el = $('<li class="dropdown"><a class="dropdown-toggle"	data-toggle="dropdown" href="#">'+
						self.name+
						' <span class="badge pull-right">'+self.hosts.length+'</span>'+
					'</a></li>');
		var ul = $('<ul class="dropdown-menu"/>');
		for (var i = 0; i < self.hosts.length; i++) {
			ul.append( self.hosts[i].renderNav() );
		}
		ul.appendTo(el);
		self.nav = el;
		return el;
	};
	this.active = function(){
		if( self.hosts.length > 1 ){
			self.nav.addClass('active');
		}
	};
};
