'use strict';
var express = require('express');
var app = express();

// Use the built-in express middleware for serving static files from './public'
app.use("/bower_components",express.static(__dirname+'/build/bundled/bower_components'));

// / endpoint
app.get("/",function(req,res){
    //Serve page if user gets the password
    if(req.query.pwd =="bluejay101"){
        app.use(express.static(__dirname+'/build/bundled/'));
        res.sendFile(__dirname+"/build/bundled/index.html");
    }else{
        res.status(403).json({message:"you dont have access to this page"});
    }
});
app.get("/capture",function(req,res){
    //Serve page if user gets the password
    if(req.query.pwd =="bluejay101"){
        app.use(express.static(__dirname+'/build/bundled/'));
        res.sendFile(__dirname+"/build/bundled/test-image.html");
    }else{
        res.status(403).json({message:"you dont have access to this page"});
    }
});



// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});