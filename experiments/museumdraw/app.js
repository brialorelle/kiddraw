global.__base = __dirname + '/';

var 
    use_https     = true,
    argv          = require('minimist')(process.argv.slice(2)),
    https         = require('https'),
    fs            = require('fs'),
    app           = require('express')(),
    _             = require('lodash');


var gameport;

if(argv.gameport) {
  gameport = argv.gameport;
  console.log('using port ' + gameport);
} else {
  gameport = 8888;
  console.log('no gameport specified: using 8888\nUse the --gameport flag to change');
}

try {
  var privateKey  = fs.readFileSync('/etc/apache2/ssl/rxdhawkins.me.key'),
      certificate = fs.readFileSync('/etc/apache2/ssl/rxdhawkins.me.crt'),
      intermed    = fs.readFileSync('/etc/apache2/ssl/intermediate.crt'),
      options     = {key: privateKey, cert: certificate, ca: intermed},
      server      = require('https').createServer(options,app).listen(gameport),
      io          = require('socket.io')(server);
} catch (err) {
  console.log("cannot find SSL certificates; falling back to http");
  var server      = app.listen(gameport),
      io          = require('socket.io')(server);
}

app.get('/*', (req, res) => {
  serveFile(req, res); 
});

var socket = io.connect('http://localhost:8001');

var serveFile = function(req, res) {
  var fileName = req.params[0];
  console.log('\t :: Express :: file requested: ' + fileName);
  return res.sendFile(fileName, {root: __dirname}); 
};

var writeDataToMongo = function(data) {
  var postData = _.extend({
    dbname: data['dbname'],
    colname: data['colname']
	  }, line);
	  sendPostRequest(
    	'http://localhost:4000/db/insert',
    	{ json: postData },
    	(error, res, body) => {
      if (!error && res.statusCode === 200) {
        console.log(`sent data to store`);
      } else {
		console.log(`error sending data to store: ${error} ${body}`);
      }
    }
  );
};
