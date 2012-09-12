var Host = function(opts){
	var self = this;

	var defaults = {
		id: '',
		name: '',
		group: '',
		graphite: '',
		graphGroups: [],
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
		if( self.nodes.length === 0 ){
			self.getNodes(self.id+'.*', function(nodes){
				self.nodes = nodes;
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
			self.graphGroups.push( new GraphGroup(key, self, templates[key], {graphite: self.graphite}, count) );
		}
	};
	this.getNodes = function( node, cb ){
		var url = self.graphite+'/metrics/find/?format=treejson&query='+node;
		$.getJSON(url, function(d,s){
			self.processNodes(d, s, cb);
		});
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
	this._renderGraph = function( templates ){
		main.body.children().remove();

		for (var i = 0; i < self.graphGroups.length; i++) {
			main.body.append( self.graphGroups[i].render() );
		}

		//browser doesnt take care of this because most of the content is loaded after it attempts to scroll to an anchor
		if( document.location.hash.length > 0 ){
			var hash = document.location.hash.substr(1, document.location.hash.length);
			$.scrollTo('#'+hash);
		}

	};

	this.active = function(){
		main.reset();
		main.activeHost = self;
		self.nav.addClass('active');
		main.title.text(self.name);
		self.group.active();
		self.renderGraph( clone(graphTemplates) );
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
