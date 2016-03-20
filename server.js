var express = require('express');
var app = express();
var server = require('http').createServer(app);
var conf = require('./config.json');

server.listen(conf.port);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.html');
});