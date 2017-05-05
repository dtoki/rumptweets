'use strict';
const express = require("express"),
app = express(),
http = require("http"),
bodyParser = require('body-parser');


//global variables
var log;
var gcs;
var bucket;

//enable stack driver
//require('@google-cloud/debug-agent').start({ allowExpressions: true,capture: { maxFrames: 20, maxProperties: 100 } });


//initGoogleServices();
//define the static folders
app.use(express.static(__dirname+'/front-end-module/build/default/'));

app.use(bodyParser.json());
const webaproute = require('./front-end-module/routes');
app.use('/', webaproute);
const apiroute = require('./image-server-module/api')
app.use('/api', apiroute);



http.createServer(app).listen(8080,()=>{
  console.log(`App listening on port 8080`);
  console.log('Press Ctrl+C to quit.');
});