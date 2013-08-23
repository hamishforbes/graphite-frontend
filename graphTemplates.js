var graphTemplates ={
	system:{
		cpu: {
			title: 'CPU Usage',
			hideLegend: false,
			target:[
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.cpu.interrupt.value),200),5)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.cpu.nice.value),200),5)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.cpu.softirq.value),200),5)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.cpu.steal.value),200),5)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.cpu.system.value),200),5)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.cpu.user.value),200),5)',
				'aliasByNode(removeAboveValue(averageSeries(%HOSTID%.cpu.*.cpu.wait.value),200),5)'
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
		}
	},
	disk:{
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
				'aliasByNode(asPercent(divideSeries(%HOSTID%.df.df.%NODEID%.used,sumSeries(%HOSTID%.df.df.%NODEID%.free,%HOSTID%.df.df.%NODEID%.used)),1),4)'
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
		}
	},
	net:{
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
				'legendValue(alias(%HOSTID%.interface.if_octets.%NODEID%.rx,"%NODEID% rx"),"total","si")'
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
				'legendValue(alias(%HOSTID%.interface.if_octets.%NODEID%.tx,"%NODEID% tx"),"total","si")'
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
				'alias(%HOSTID%.tcpconns.%NODEID%.tcp_connections.syn_recv.value,"%NODEID% syn_recv")',
				'alias(%HOSTID%.tcpconns.%NODEID%.tcp_connections.syn_recv.value,"%NODEID% syn_sent")'
			],
			format: 'png',
			areaMode: 'all'
		}
	},
	apache:{
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
				'removeAboveValue(%HOSTID%.apache.apache_requests.count,1000)'
			],
			format: 'png',
			areaMode: 'all'
		}
	},
	nginx:{
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
				'removeBelowValue(removeAboveValue(%HOSTID%.nginx.nginx_requests.value,5000),-1)',
				'movingAverage(removeBelowValue(removeAboveValue(%HOSTID%.nginx.nginx_requests.value,5000),-1),60)'
			],
			format: 'png',
			areaMode: 'all'
		},
		nginx_ok_req_breakdown: {
			depends: 'tail',
			title:  'Nginx Successful Requests Breakdown per Second',
			hideLegend: false,
			target:[
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_ok.value,5))',
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_notmodified.value,5))',
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_redirect.value,5))'
			],
			format: 'png',
			areaMode: 'none'
		},
		nginx_fail_req_breakdown: {
			depends: 'tail',
			title:  'Nginx Failed Requests Breakdown per Second',
			hideLegend: false,
			target:[
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_gatewaytimeout.value,5))',
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_internalservererror.value,5))',
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_notfound.value,5))',
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_badgateway.value,5))',
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_forbidden.value,5))',
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_serviceunavailable.value,5))',
				'sortByMaxima(aliasByNode(%HOSTID%.tail.nginx.derive.req_usercancelled.value,5))'
			],
			format: 'png',
			areaMode: 'none'
		},
		nginx_res_time: {
			depends: 'tail',
			title:  'Nginx Average Response Time',
			hideLegend: false,
			target:[
				'cactiStyle(alias(scale(%HOSTID%.tail.nginx.response_time.res_avg.value,1000),"response time"))'
			],
			vtitle: 'Average response time in ms',
			format: 'png',
			areaMode: 'none'
		},
		nginx_res_size: {
			depends: 'tail',
			title:  'Nginx Total request body size',
			hideLegend: false,
			target:[
				'legendValue(aliasByNode(scaleToSeconds(integral(%HOSTID%.tail.nginx.ipt_bytes.res_bytes_total.value),300),5),"max","si")'
			],
			vtitle: '',
			format: 'png',
			areaMode: 'none'
		}
	},
	edge:{
		edge_req: {
			depends: 'curl_json',
			title: 'Edge Requests Per Second',
			hideLegend: true,
			target:[
				'%HOSTID%.curl_json.edge.http_requests.requests-total.count'
			],
			format: 'png',
			areaMode: 'all'
		},
		edge_req_type: {
			depends: 'curl_json',
			title: 'Edge States Per Second',
			hideLegend: false,
			target:[
				'alias(%HOSTID%.curl_json.edge.http_requests.counters-hot.count,"hot")',
				'alias(%HOSTID%.curl_json.edge.http_requests.counters-subzero.count, "sub-zero")',
				'alias(%HOSTID%.curl_json.edge.http_requests.counters-warm.count, "warm")'

			],
			format: 'png',
			areaMode: 'stacked'
		},
		edge_ratio: {
			depends: 'curl_json',
			title: 'Edge Hit Ratio',
			hideLegend: true,
			target:[
				'%HOSTID%.curl_json.edge.gauge.requests-hit_rate.value'
			],
			format: 'png',
			areaMode: 'all'
		},
		edge_mem: {
			depends: 'curl_json',
			title: 'Edge Memory Usage',
			hideLegend: true,
			target:[
				'%HOSTID%.curl_json.edge.bytes.info-used_memory.value'
			],
			format: 'png',
			areaMode: 'all'
		}
	},
	redis: {

		redis_memory: {
			depends: 'redis',
			title: 'Redis Memory Used',
			hideLegend: true,
			target:[
				'%HOSTID%.redis.*.df.memory.used'
			],
			format: 'png',
			areaMode: 'all'
		},
		redis_cmd: {
			depends: 'redis',
			title: 'Redis Commands per Second',
			hideLegend: true,
			target:[
				'%HOSTID%.redis.*.memcached_command.total.value'
			],
			format: 'png',
			areaMode: 'all'
		},
		redis_keys: {
			depends: 'redis',
			title: 'Redis Total Keys',
			hideLegend: true,
			target:[
				'%HOSTID%.redis.*.memcached_items.*.value'
			],
			format: 'png',
			areaMode: 'all'
		},
		redis_client_conns: {
			depends: 'redis',
			title: 'Redis Connected Clients',
			hideLegend: true,
			target:[
				'removeBelowValue(removeAboveValue(%HOSTID%.redis.*.memcached_connections.clients.value,5000),-1)'
			],
			format: 'png',
			areaMode: 'none'
		},
		redis_slave_conns: {
			depends: 'redis',
			title: 'Redis Connected Slaves',
			hideLegend: true,
			target:[
				'%HOSTID%.redis.*.memcached_connections.slaves.value'
			],
			format: 'png',
			areaMode: 'none'
		},
	}
};
