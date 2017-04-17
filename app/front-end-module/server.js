'use strict';
var express = require('express');
var app = express();
var fs = require('fs');
var cheerio = require('cheerio');
var https = require("https");
var http = require("http");
// var bodyParser = require('body-parser');
//Enable stack driver
require('@google-cloud/debug-agent').start({ allowExpressions: true,capture: { maxFrames: 20, maxProperties: 100 } });

//use the body parser
// app.use(bodyParser.json());
var logging;
//Logic to instantiate differently based on were being served
if(process.argv[2]=="-d"){
    //Gcloud logging
    logging = require('@google-cloud/logging')({
        projectId: 'rumptweets-2c7cc',
        keyFilename: __dirname + '/keys/app_engine_key.json'
    });
}else{
    //Gcloud logging
    logging = require('@google-cloud/logging')();
}
var log = logging.log('syslog');


//Load the certificates

var certificate = fs.readFileSync("sslcert/cert.pem","utf8");
var privateKey = fs.readFileSync("sslcert/private.pem","utf8");
 var credentials = { key: privateKey, cert: certificate}

// Use the built-in express middleware for serving static files from './public'
app.use("/bower_components",express.static(__dirname+'/build/default/bower_components'));
app.use("/src",express.static(__dirname+'/build/default/src'));
app.use("/images",express.static(__dirname+'/build/default/images'));
app.use(express.static(__dirname+'/.well-known/acme-challenge'));
var facebookHtml = cheerio.load(fs.readFileSync('src/facebook-image.html','utf8'));

// / endpoint
var entry;
app.get("/", httpRedirect , function(req,res){
    app.use(express.static(__dirname+'/build/default/'));
    if(req.get('User-Agent').indexOf("facebookexternalhit")!=-1){
        //Log 
        console.log("facebook_hit");
        entry = log.entry( {
            get_request_origin: 'facebook bot',
            page_requested: "test-image.html",
            user_ip: `${req.ip}`

        });
        res.sendFile(__dirname+"/build/default/index.html");
    }else{
        console.log("user_hit");
        entry = log.entry( {
            get_request_origin: 'users browser',
            page_requested: "index.html",
            user_ip: `${req.ip}`
        });
        res.sendFile(__dirname+"/build/default/index.html");
    }
    //Log response to stack driver
    log.info(entry, function(err, apiResponse) {
        if (!err) {
        console.log("log entry: sucess");
        }else{
            console.log(err);
        }
    });
    
});


// Validate using acme challenge
// app.get("/.well-known/acme-challenge/*",function(req,res){
//     res.sendFile(__dirname+"/.well-known/acme-challenge/of1eUXz7kmh9DJuemNr_syW5emE5dpL-ydhkYu6Hv3M")
// });

// Endpoint for user_id / image_id  
app.get("/tweetgallery/:user_id/:image_id",httpRedirect ,function(req,res){
    const  hostname=req.hostname
    //Path to images
    const ogUrl = "https" + "://" + hostname + + "/tweetgallery" + "/" + req.params.user_id + "/" + req.params.image_id;
    const imgUrl = "https" + "://" + "storage.googleapis.com/rumptweets-2c7cc.appspot.com/upload_folder" + "/" + req.params.user_id + "/" + req.params.image_id + ".png";
    //Check if the request is from facebook or a users browser
    if(req.get('User-Agent').indexOf("facebookexternalhit")!=-1){
        facebookHtml("#ogUrl").attr('content',ogUrl);
        facebookHtml("#imgUrl").attr('content',imgUrl);
        facebookHtml("#imageUrl2").attr('src',imgUrl);
       
        // Change the app id based on the hostname
        if(hostname.indexOf("develop")!=-1){
            facebookHtml("#fbAppId").attr('content',"235219446946008");
        }
        else if(hostname.indexOf("test")!=-1){
            //Found
            facebookHtml("#fbAppId").attr('content',"228591024275517");
        }else{
            //NotFound
            facebookHtml("#fbAppId").attr('content',"221420734992546");
        }
        // return the file to te user
        res.send(facebookHtml.html());

        entry = log.entry( {
            get_request_origin: 'facebook bot',
            page_requested: "image generated wrapped in html tags",
            imageId: `${req.params.user_id + "/" + req.params.image_id}`,
            imageUrl: `${imgUrl}`,
            siteUrl: `${ogUrl}`,
            user_ip: `${req.ip}`
        });
        //Log response to stack driver
        log.info(entry, function(err, apiResponse) {
            if (!err) {
            console.log("log entry: sucess");
            }else{
                console.log(err);
            }
        });
        
    }else{
        console.log("user-hit");
        res.sendFile(__dirname+"/build/default/index.html");
        entry = log.entry( {
            get_request_origin: 'users browser',
            page_requested: "tweet galaxy page",
            imageId: `${req.params.user_id + "/" + req.params.image_id}`,
            imageUrl: `${imgUrl}`,
            siteUrl: `${ogUrl}`,
            user_ip: `${req.ip}`
        });
        //Log response to stack driver
        log.info(entry, function(err, apiResponse) {
            if (!err) {
            console.log("log entry: sucess");
            }else{
                console.log(err);
            }
        });
    }
   
});

app.post("/consolelog",function(req,res){
    // var userpost = req.body;
    // var entry;
    // if(userpost.consolelog==undefined || userpost.consolelog==null){
    //     console.log("web client console log incomplete");
    //     res.send(200,"You need to include the log");
    // }else{
    //     entry = log.entry( {
    //         user_ip: `${req.ip}`
    //     },userpost.consolelog);
    //     log.alert(entry).then(function(data){
    //         console.log(data[0]);
    //         console.log("web client message logged");
    //         res.send(200,"entry sucessful");
    //     }).catch(function(data){
    //         console.log(data[0]);
    //     });
    // }
});

function auth(req,res,next){
     if(req.query.pwd =="bluejay101"){
         next();
     }else{
        res.status(403).json({message:"you dont have access to this page"});
     }
}

function httpRedirect(req,res,next){
    //If not secure or www is present
    if(req.subdomains[0]=="www" || req.get('X-Forwarded-Proto') == 'http'){
        console.log("redirectin");
        res.redirect("https://rumptweets.com");
    }
    next();
}

// Start the server
const PORT = process.env.PORT || 8080;
https.createServer(credentials, app).listen(443,()=>{
    console.log(`App listening on port ${PORT}`)
});

//TODO: Need to ensure that http redirects to https if not have to use app
http.createServer(app).listen(8080,()=>{
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});


// app.listen(PORT, () => {
 
// });