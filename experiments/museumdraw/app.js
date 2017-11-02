console.log('Running app.js')
const express = require('express');
const app = express();

app.listen(8889, function() {
    console.log('listening on 8889')
});

app.get('/*', (req, res) => {
  serveFile(req, res); 
});

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
