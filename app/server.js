'use strict';
const express = require("express"),
app = express(),
http = require("http"),
https = require("https"),
fs = require("fs"),
bodyParser = require('body-parser');


//global variables
var log;
var gcs;
var bucket;

//enable stack driver
require('@google-cloud/debug-agent').start({ allowExpressions: true,capture: { maxFrames: 20, maxProperties: 100 } });

const certificate = fs.readFileSync("certs/cert.pem","utf8");
const privateKey = fs.readFileSync("certs/private.pem","utf8");
var credentials = { key: privateKey, cert: certificate}
//define the static folders


app.use(bodyParser.json());
const webaproute = require('./front-end-module/routes');
app.use('/', webaproute);
const apiroute = require('./image-server-module/api')
app.use('/api', apiroute);

//placing this after so the routs are called first
app.use(express.static(__dirname+'/front-end-module/build/default/'));



https.createServer(credentials, app).listen(8443,()=>{
    console.log(`Secure app listening on port 8443`)
});

http.createServer(app).listen(8080,()=>{
  console.log(`App listening on port 8080`);
  console.log('Press Ctrl+C to quit.');
});