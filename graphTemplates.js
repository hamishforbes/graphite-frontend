var graphTemplates ={ 
	cpu: {
		title: 'CPU Usage',
		hideLegend: false,
		target:[
			'aliasByNode(averageSeries(%HOSTID%.cpu.*.cpu.interrupt.value),5)',
			'aliasByNode(averageSeries(%HOSTID%.cpu.*.cpu.nice.value),5)',
			'aliasByNode(averageSeries(%HOSTID%.cpu.*.cpu.softirq.value),5)',
			'aliasByNode(averageSeries(%HOSTID%.cpu.*.cpu.steal.value),5)',
			'aliasByNode(averageSeries(%HOSTID%.cpu.*.cpu.system.value),5)',
			'aliasByNode(averageSeries(%HOSTID%.cpu.*.cpu.user.value),5)',
			'aliasByNode(averageSeries(%HOSTID%.cpu.*.cpu.wait.value),5)',
		],
		format: 'png',
		areaMode: 'stacked'
	},
	load: {	
		title: 'Load',
		hideLegend: true,
		target:[
			'stacked(%HOSTID%.load.load.shortterm)',
			'lineWidth(%HOSTID%.load.load.midterm,5)',
			'lineWidth(%HOSTID%.load.load.longterm,5)'
		],
		format: 'png',
		areaMode: 'none'
	},
	memory: {
		title: 'Memory',
		hideLegend: false,
		target:[
			'aliasByNode(%HOSTID%.memory.memory.used.value,4)',
			'aliasByNode(%HOSTID%.memory.memory.buffered.value,4)',
			'aliasByNode(%HOSTID%.memory.memory.cached.value,4)',
			'aliasByNode(%HOSTID%.memory.memory.free.value,4)'
		],
		format: 'png',
		areaMode: 'stacked'
	},
	swap_usage: {
		depends: 'swap',
		title: 'Swap Usage',
		hideLegend: false,
		target:[
			'aliasByNode(%HOSTID%.swap.swap.cached.value,4)',
			'aliasByNode(%HOSTID%.swap.swap.used.value,4)',
			'aliasByNode(%HOSTID%.swap.swap.free.value,4)'
		],
		format: 'png',
		areaMode: 'stacked'
	},
	apache_score: {
		depends: 'apache',
		title: 'Apache Scoreboard',
		hideLegend: false,
		target:[
			'sortByMaxima(aliasByNode(%HOSTID%.apache.apache_scoreboard.*.count,4))'
		],
		format: 'png',
		areaMode: 'stacked'
	},
	apache_conn: {
		depends: 'apache',
		title: 'Apache Connections',
		hideLegend: true,
		target:[
			'%HOSTID%.apache.apache_connections.count'
		],
		format: 'png',
		areaMode: 'all'
	},
	apache_req: {
		depends: 'apache',
		title: 'Apache Requests Per Second',
		hideLegend: true,
		target:[
			'removeAboveValue(scaleToSeconds(%HOSTID%.apache.apache_requests.count,60),1000)'
		],
		format: 'png',
		areaMode: 'all'
	},
	nginx_conn: {
		depends: 'nginx',
		title: 'Nginx Connections',
		hideLegend: false,
		target:[
			'sortByMaxima(aliasByNode(%HOSTID%.nginx.nginx_connections.*.value,4))'
		],
		format: 'png',
		areaMode: 'none'
	},
	nginx_req: {
		depends: 'nginx',
		title: 'Nginx Requests Per Second',
		hideLegend: true,
		target:[
			'scaleToSeconds(%HOSTID%.nginx.nginx_requests.value,60)'
		],
		format: 'png',
		areaMode: 'all'
	},
	disk: {
		depends: 'df',
		multi: {
			source: 'df.df.*',
			filter: 'dev',
			merge: true
		},
		title: '% Used Disk',
		hideLegend: false,
		target:[
			'aliasByNode(asPercent(divideSeries(%HOSTID%.df.df.%NODEID%.used,sumSeries(%HOSTID%.df.df.%NODEID%.free,%HOSTID%.df.df.%NODEID%.used)),1),4)',
		],
		format: 'png',
		areaMode: 'none'
	},
	network_in: {
		depends: 'interface',
		multi: {
			source: 'interface.if_octets.*',
			filter: 'sit',
			merge: true
		},
		title: 'Network Traffic In',
		hideLegend: false,
		target:[
			'alias(%HOSTID%.interface.if_octets.%NODEID%.rx,"%NODEID% rx")'
		],
		format: 'png',
		areaMode: 'none'
	},
	network_out: {
		depends: 'interface',
		multi: {
			source: 'interface.if_octets.*',
			filter: 'sit',
			merge: true
		},
		title: 'Network Traffic Out',
		hideLegend: false,
		target:[
			'alias(%HOSTID%.interface.if_octets.%NODEID%.tx,"%NODEID% tx")'
		],
		format: 'png',
		areaMode: 'none'
	},
	tcpconns: {
		depends: 'tcpconns',
		multi: {
			source: 'tcpconns.*',
			merge: false
		},
		title: 'TCP Connections',
		hideLegend: false,
		target:[
			'alias(%HOSTID%.tcpconns.%NODEID%.tcp_connections.established.value,"%NODEID% established")',
			'alias(%HOSTID%.tcpconns.%NODEID%.tcp_connections.syn_recv.value,"%NODEID% syn_recv")'
		],
		format: 'png',
		areaMode: 'all'
	},
	squid_req: {
		depends: 'squid',
		title: 'Squid Requests Per Second',
		hideLegend: true,
		target:[
			'stacked(scaleToSeconds(%HOSTID%.squid.counter.client_http_requests.value,60))',
			'color(lineWidth(movingAverage(scaleToSeconds(%HOSTID%.squid.counter.client_http_requests.value,60),100),2),"red")'	
		],
		format: 'png',
		areaMode: 'none'
	},
	disk_ops: {
		depends: 'disk',
		multi: {
			source: 'disk.*',
			filter: ['dm','c0d0p'],
			merge: true
		},
		title: 'Disk Ops',
		hideLegend: false,
		target:[
			'alias(%HOSTID%.disk.%NODEID%.disk_ops.read,"%NODEID% read")',
			'alias(%HOSTID%.disk.%NODEID%.disk_ops.write,"%NODEID% write")'
		],
		format: 'png',
		areaMode: 'none'
	},

}