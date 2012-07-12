var Graph = function(id, opts){
	var self = this;
	this.id = id;

	var defaults = {
		renderURL: 'http://collectd.squiz.co.uk/render',
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
