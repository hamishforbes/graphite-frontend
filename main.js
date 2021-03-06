var groupAlias = {
//	'edge': [ /-edge[0-9]+$/, /\.squizedge\.net/ ]
};

var Main = function(graphite, node){
	var self = this;

	this.graphite = graphite || 'http://graphite.squiz.co.uk';
	this.node = node || 'squiz_uk.*';

	this.hostsURL = self.graphite+'/metrics/find/?format=treejson&query='+self.node;
	this.groups = {};
	this.hosts = {};
	this.activeHost = null;
	this.from = '';
	this.until = '';

	this.hostlist = $('#hostlist');
	this.body = $('#body');
	this.hostsearch = $('#hostsearch');
	this.title = $('#title');
	this.relativeForm = $('#relative');
	this.absoluteForm = $('#absolute');

	//get list of hosts
	this.processHosts = function(hosts, status){
		if( status != 'success'){
			log('failed to get hosts');
			return;
		}

		//get list of groups/hosts
		for (var i = 0; i < hosts.length; i++) {
			var host = new Host({id: hosts[i].id, name: hosts[i].text, graphite: self.graphite});
			var g = host.name.split('-')[0];
			self.hosts[host.name] = host;

			if( typeof(self.groups[g]) !=  'undefined'){
				self.groups[g].push(host);
			}else{
				self.groups[g] = new Hostgroup({name: g}).push(host);
			}
			//check manual groups
			for ( g in groupAlias ) {
				//push new group
				if( typeof(self.groups[g]) ==  'undefined'){
					self.groups[g] = new Hostgroup({name: g});
				}
				//loop over definitions for this group
				for (var j = 0; j < groupAlias[g].length; j++) {
					if( typeof(groupAlias[g][j]) == 'string' && host.name == groupAlias[g][j] ){
						self.groups[g].push(host);
					}else if( typeof(groupAlias[g][j]) == 'object' && groupAlias[g][j].test(host.name) ){
						self.groups[g].push(host);
					}
				}
			}
		}

		//build nav
		for( var group in self.groups ){
			self.groups[group].renderNav().appendTo(self.hostlist);
		}

		//setup host search box
		self.hostsearch.typeahead({ source: Object.keys(self.hosts) })
			.parent('form').submit(self.searchHost);

		//navigation/routes/whatever
		//we need to have the hosts data before we can route so dont bind until now
		window.onpopstate = self.route;
		//initial routing
		self.route();
	};
	$.getJSON(this.hostsURL, this.processHosts);

	this.searchHost = function(e){
		e.preventDefault();
		var host = $(this).children('input').val();
		if( typeof(self.hosts[host]) != 'undefined'){
			self.hosts[host].active();
		}
	};

	this.reset = function(){
		//reset nav and body div
		self.hostlist.find('.active').removeClass('active');
		self.body.text('').children().remove();
		self.hostsearch.val('');
	};

	//time forms
	this.setRelative = function(e){
		e.preventDefault();
		var val = $(this).children('input').val();
		var unit = $(this).children('select').val();
		if( val !== '' ){
			self.from = '-'+val+unit;
			self.until = '';
			window.history.pushState(
				{host: self.activeHost.name},
				self.activeHost.name,
				self.activeHost.name+'?relative='+val+'&unit='+unit
			);
			self.activeHost.refresh();
		}
	};
	self.relativeForm.submit( self.setRelative );

	this.setAbsolute = function(e){
		//HH:MM_YYMMDD
		e.preventDefault();

		var from_d = $(this).find('input[name="from_d"]').val();
		var from_t = $(this).find('input[name="from_t"]').val();
		var until_d = $(this).find('input[name="until_d"]').val();
		var until_t = $(this).find('input[name="until_t"]').val();
		log( 'from: '+from_d+' '+from_t);
		log( 'until: '+until_d+' '+until_t);
		//from is required, until is not (defaults to now)
		if( until_d !== '' ){
			self.until = self.parseDate(until_d, until_t);
		}
		if( from_d !== '' ){
			self.from = self.parseDate(from_d, from_t);
			window.history.pushState(
				{host: self.activeHost.name},
				self.activeHost.name,
				self.activeHost.name+'?from='+self.from+'&until='+self.until
			);
			self.activeHost.refresh();
		}
	};
	this.parseDate = function(in_d, in_t){
		in_d = in_d.split('-');
		if( in_t.length == 5 && in_t.indexOf(':') !== -1){
			in_t = in_t.split(':');
		}else if (in_t.length == 4 && in_t.indexOf(':') == -1){
			//no seperating colon
			var h = in_t.substr(0,2);
			var m = in_t.substr(2,4);
			in_t = [h,m];
		}else{
			in_t = [0,0];
		}
		var d = new Date(in_d[2], in_d[1], in_d[0], in_t[0], in_t[1], 0, 0);

		return d.getHours().toString().padLeft(2,'0') +
				':'+ d.getMinutes().toString().padLeft(2,'0') +
				'_'+ d.getFullYear().toString() +
				d.getMonth().toString().padLeft(2,'0') +
				d.getDate().toString().padLeft(2,'0');
	};
	this.reformatDate = function(str){
		var y = str.substr(0,4);
		var m = str.substr(4,2);
		var d = str.substr(6,8);
		return d+'-'+m+'-'+y;
	};
	self.absoluteForm.submit( self.setAbsolute );

	self.route = function(e){
		log(e);
		//calculate interval
		if( document.location.search !== '' ){
			var rel = /\?relative=([0-9]+)&unit=([a-z]+)/;
			var abs = /\?from=([0-9_:]+)&until=([0-9_:]+)/;
			if( rel.test(document.location.search) ){
				matches = document.location.search.match(rel);
				if( matches.length == 3 ){
					var val = matches[1];
					var unit = matches[2];
					self.from = '-'+val+unit;
					log('setting interval to '+self.from);
					self.relativeForm.children('input').first().val(val);
					self.relativeForm.children('select').val(unit);
				}
			}else if( abs.test(document.location.search) ){
				matches = document.location.search.match( abs );
				if( matches.length == 3){
					self.from = matches[1];
					self.until = matches[2];
					log('setting interval from '+matches[1]+' to '+matches[2]);

					var from = matches[1].split('_');
					var until = matches[2].split('_');
					self.absoluteForm.find('input[name="from_d"]').val(self.reformatDate(from[1]));
					self.absoluteForm.find('input[name="from_t"]').val(from[0]);
					self.absoluteForm.find('input[name="until_d"]').val(self.reformatDate(until[1]));
					self.absoluteForm.find('input[name="until_t"]').val(until[0]);
					}
			}
		}

		//find host
		var host;
		var path = document.location.pathname;

		switch(true){
			case e && e.state && typeof(e.state.host) != 'undefined':
				//popstate event
				host = e.state.host;
			break;

			case /^\/host\/.*/.test(path):
				//load host from url
				host = document.location.pathname.match(/^\/host\/(.*)/)[1];
			break;

			default:
				host = 'dash';
			break;
		}

		log('routing to '+host);
		if( typeof(self.hosts[host]) != 'undefined' ){
			if( self.activeHost && self.activeHost.name == host ){
				//already active, refresh
				self.activeHost.refresh();
			}else{
				self.hosts[host].active();
			}
			return;
		}
		if( host == 'dash'){
			//load the dashboard
			return;
		}
		log('host not found');
		return;
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
