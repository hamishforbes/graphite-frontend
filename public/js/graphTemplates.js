var graphTemplates ={
	system:{
		cpu: {
			title: 'CPU Usage',
			hideLegend: false,
			target:[
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.interrupt),200),4)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.nice),200),4)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.softirq),200),4)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.steal),200),4)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.system),200),4)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.user),200),4)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.wait),200),4)'
			],
			format: 'png',
			areaMode: 'stacked',
			aggregate: false
		},
		load: {
			title: 'Load',
			hideLegend: true,
			target:[
				'stacked(%HOSTID%.load.shortterm)',
				'lineWidth(%HOSTID%.load.midterm,3)',
				'lineWidth(%HOSTID%.load.longterm,3)'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: 'avg'
		},
		memory: {
			title: 'Memory',
			hideLegend: false,
			target:[
				'aliasByNode(%HOSTID%.memory.used,3)',
				'aliasByNode(%HOSTID%.memory.buffered,3)',
				'aliasByNode(%HOSTID%.memory.cached,3)',
				'aliasByNode(%HOSTID%.memory.free,3)'
			],
			format: 'png',
			areaMode: 'stacked',
			aggregate: 'avg'
		},
		swap_usage: {
			depends: 'swap',
			title: 'Swap Usage',
			hideLegend: false,
			target:[
				'aliasByNode(%HOSTID%.swap.cached,3)',
				'aliasByNode(%HOSTID%.swap.used,3)',
				'aliasByNode(%HOSTID%.swap.free,3)'
			],
			format: 'png',
			areaMode: 'stacked',
			aggregate: 'avg'
		}
	},
	disk:{
		disk: {
			depends: 'df',
			multi: {
				source: 'df.*',
				filter: 'dev',
				merge: true
			},
			title: '% Used Disk',
			hideLegend: false,
			target:[
				'aliasByNode(asPercent(divideSeries(%HOSTID%.df.%NODEID%.used,sumSeries(%HOSTID%.df.%NODEID%.free,%HOSTID%.df.%NODEID%.used)),1),3)'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: 'avg'
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
				'alias(%HOSTID%.disk.%NODEID%.ops.read,"%NODEID% read")',
				'alias(%HOSTID%.disk.%NODEID%.ops.write,"%NODEID% write")'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: 'avg'
		}
	},
	net:{
		network_in: {
			depends: 'interface',
			multi: {
				source: 'interface.octets.*',
				filter: 'sit',
				merge: true
			},
			title: 'Network Traffic In',
			hideLegend: false,
			target:[
				'legendValue(alias(%HOSTID%.interface.octets.%NODEID%.rx,"%NODEID% rx"),"total","si")'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: 'sum'
		},
		network_out: {
			depends: 'interface',
			multi: {
				source: 'interface.octets.*',
				filter: 'sit',
				merge: true
			},
			title: 'Network Traffic Out',
			hideLegend: false,
			target:[
				'legendValue(alias(%HOSTID%.interface.octets.%NODEID%.tx,"%NODEID% tx"),"total","si")'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: 'sum'
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
				'alias(%HOSTID%.tcpconns.%NODEID%.ESTABLISHED,"%NODEID% established")',
				'alias(%HOSTID%.tcpconns.%NODEID%.SYN_RECV,"%NODEID% syn_recv")',
				'alias(%HOSTID%.tcpconns.%NODEID%.SYN_SENT,"%NODEID% syn_sent")'
			],
			format: 'png',
			areaMode: 'all',
			aggregate: 'sum'
		}
	},
	apache:{
		apache_score: {
			depends: 'apache',
			title: 'Apache Scoreboard',
			hideLegend: false,
			target:[
				'sortByMaxima(aliasByNode(%HOSTID%.apache.scoreboard.*.count,4))'
			],
			format: 'png',
			areaMode: 'stacked',
			aggregate: 'avg'
		},
		apache_conn: {
			depends: 'apache',
			title: 'Apache Connections',
			hideLegend: true,
			target:[
				'%HOSTID%.apache.connections.count'
			],
			format: 'png',
			areaMode: 'all',
			aggregate: 'sum'
		},
		apache_req: {
			depends: 'apache',
			title: 'Apache Requests Per Second',
			hideLegend: true,
			target:[
				'removeAboveValue(%HOSTID%.apache.requests.count,1000)'
			],
			format: 'png',
			areaMode: 'all',
			aggregate: 'sum'
		}
	},
	nginx:{
		nginx_conn: {
			depends: 'nginx',
			title: 'Nginx Connections',
			hideLegend: false,
			target:[
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.connections.*,4))'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: 'sum'
		},
		nginx_req: {
			depends: 'nginx',
			title: 'Nginx Requests Per Second',
			hideLegend: true,
			target:[
				'removeBelowValue(removeAboveValue(%HOSTID%.nginx.nginx_requests,5000),-1)',
				'movingAverage(removeBelowValue(removeAboveValue(%HOSTID%.nginx.nginx_requests,5000),-1),60)'
			],
			format: 'png',
			areaMode: 'all',
			aggregate: 'sum'
		},
		nginx_ok_req_breakdown: {
			depends: 'nginx.status',
			title:  'Nginx Successful Requests Breakdown per Second',
			hideLegend: false,
			target:[
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_ok,4))',
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_notmodified,4))',
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_redirect,4))'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: 'sum'
		},
		nginx_fail_req_breakdown: {
			depends: 'nginx.status',
			title:  'Nginx Failed Requests Breakdown per Second',
			hideLegend: false,
			target:[
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_gatewaytimeout,4))',
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_internalservererror,4))',
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_notfound,4))',
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_badgateway,4))',
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_forbidden,4))',
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_serviceunavailable,4))',
				'sortByMaxima(aliasByNode(%HOSTID%.nginx.status.req_usercancelled,4))'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: 'sum'
		},
		nginx_res_time: {
			depends: 'nginx.response_time',
			title:  'Nginx Average Response Time',
			hideLegend: false,
			target:[
				'cactiStyle(alias(scale(%HOSTID%.nginx.response_time.res_avg,1000),"response time"))'
			],
			vtitle: 'Average response time in ms',
			format: 'png',
			areaMode: 'none',
			aggregate: 'avg'
		},
		nginx_res_size: {
			depends: 'nginx.response_bytes',
			title:  'Nginx Total request body size',
			hideLegend: false,
			target:[
				'legendValue(aliasByNode(scaleToSeconds(integral(%HOSTID%.nginx.response_bytes.res_bytes),300),4),"max","si")'
			],
			vtitle: '',
			format: 'png',
			areaMode: 'none',
			aggregate: 'sum'
		}
	},
	redis: {

		redis_memory: {
			depends: 'redis',
			title: 'Redis Memory Used',
			hideLegend: true,
			target:[
				'%HOSTID%.redis.*.memory_used'
			],
			format: 'png',
			areaMode: 'all',
			aggregate: 'sum'
		},
		redis_cmd: {
			depends: 'redis',
			title: 'Redis Commands per Second',
			hideLegend: true,
			target:[
				'%HOSTID%.redis.*.commands'
			],
			format: 'png',
			areaMode: 'all',
			aggregate: 'avg'
		},
		redis_keys: {
			depends: 'redis',
			title: 'Redis Total Keys',
			hideLegend: true,
			target:[
				'%HOSTID%.redis.*.keys.*'
			],
			format: 'png',
			areaMode: 'all',
			aggregate: 'sum'
		},
		redis_client_conns: {
			depends: 'redis',
			title: 'Redis Connected Clients',
			hideLegend: true,
			target:[
				'removeBelowValue(removeAboveValue(%HOSTID%.redis.*.connections.clients,5000),-1)'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: 'avg'
		},
		redis_slave_conns: {
			depends: 'redis',
			title: 'Redis Connected Slaves',
			hideLegend: true,
			target:[
				'%HOSTID%.redis.*.connections.slaves'
			],
			format: 'png',
			areaMode: 'none',
			aggregate: false
		},
	}
};
