var DashBoard = function(hosts, templates){
	var self = this;
	this.hosts = hosts;
	this.templates = templates;
	this.active = true;

	this.render = function(){
		main.body.html('');
		var h;
		for (h in self.hosts) { //loop over hosts
			for (var i = 0; i < self.hosts[h].graphGroups.length; i++) { // loop over graph groups
				for (var j = 0; j < self.hosts[h].graphGroups[i].graphs.length; j++) { //loops over graphs
					self.hosts[h].graphGroups[i].graphs[j].img.appendTo(main.body);
				}
			}
		}
	};
	this.init = function(){
		for (var key in templates) {
			for( var g in templates[key] ){
				templates[key][g].width = 250;
				templates[key][g].height = 150;
				templates[key][g].hideLegend = true;
				templates[key][g].hideAxes = true;
			}
		}
		self.buildGraphs();
	};
	this.buildGraphs = function(){
		var h;
		var total = Object.keys(self.hosts).length;
		var i = 0;
		function count(){
			i++;
			if( i == total){
				log('Graphs built');
				self.render();
			}
		}
		for (h in self.hosts) {
			self.hosts[h].buildGraphs( clone(self.templates), count );
		}
	};
	self.init();
};