var express = require('express'),
    http = require('http'),
    io = require('socket.io'),
    log = require('./lib/log.js');

var config = require("./lib/config.js"),
    Graphite = require("./lib/graphite.js").Graphite,
    templates = require('./lib/templates.js');

var tpl = templates.watch(__dirname+'/templates/');

// Read config from file
var conf = config.parseJsonFromFileSync(__dirname + '/config.json');
if (!conf) {
    console.log("Failed parsing configuration file. Exiting.");
    process.exit(10);
}

var graphite = new Graphite(conf);

//setup http server
var app = express();
var httpserver = http.createServer(app);


//configure express
app.use(express.logger());
app.use('/public', express.directory(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(app.router);
app.locals.pretty = true;


// render the initial page
// write templates directly into a <script> tag
app.get('/', function(req, res){
    res.render(__dirname + '/views/index.jade',
        {
            templates: tpl.writeTemplates(),
            graphiteURL: 'http://'+conf.graphite.host+'/render/'
    });
});

app.get('/host/:host', function(req, res){
    res.render(__dirname + '/views/index.jade',
        {
            templates: tpl.writeTemplates(),
            graphiteURL: 'http://'+conf.graphite.host+'/render/'
    });
});

app.get('/group/:group', function(req, res){
    res.render(__dirname + '/views/index.jade',
        {
            templates: tpl.writeTemplates(),
            graphiteURL: 'http://'+conf.graphite.host+'/render/'
    });
});

io = io.listen(httpserver);
io.configure(function(){
    io.set('transports', ['websocket']);
    io.set('log level', 1);
    io.enable('browser client minification');
    io.enable('browser client etag');
});

io.sockets.on('connection', function(socket){
    socket.on('getHostGroups', function(data,fn){
        fn(graphite.getHostGroups());
    });
    socket.on('getMetrics', function(data, fn){
        fn(graphite.getMetrics(data));
    });
});

// Don't start webserver until initial host data has been built
graphite.once('hostgroups_updated',function(){
    httpserver.listen(conf.port);
    log.info('Server listening on '+conf.port);
});

// Initialise data on start
graphite.updateIndex();

