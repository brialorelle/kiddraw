console.log('Running app.js')
const express = require('express');
const app = express();

app.listen(8889, function() {
    console.log('listening on 8889')
})
