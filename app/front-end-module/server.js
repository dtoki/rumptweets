'use strict';
var express = require('express');
var app = express();
var fs = require('fs');
var cheerio = require('cheerio');
var https = require("https");
//Enable stack driver
require('@google-cloud/debug-agent').start({ allowExpressions: true,capture: { maxFrames: 20, maxProperties: 100 } });
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
// var certificate = fs.readFileSync("sslcert/signed.pem","utf8");
// var privateKey = fs.readFileSync("sslcert/domain.pem","utf8");
// Put credentials in object
// var credentials = { key: privateKey, cert: certificate}


// Use the built-in express middleware for serving static files from './public'
app.use("/bower_components",express.static(__dirname+'/build/bundled/bower_components'));
app.use("/src",express.static(__dirname+'/build/bundled/src'));
app.use("/images",express.static(__dirname+'/build/bundled/images'));
app.use(express.static(__dirname+'/.well-known/acme-challenge'));
var facebookHtml = cheerio.load(fs.readFileSync('src/facebook-image.html','utf8'));

// / endpoint
var entry;
app.get("/*", httpsredirect , function(req,res){
    app.use(express.static(__dirname+'/build/bundled/'));
    if(req.get('User-Agent').indexOf("facebookexternalhit")!=-1){
        //Log 
        console.log("facebook_hit");
        entry = log.entry( {
            get_request_origin: 'facebook bot',
            page_requested: "test-image.html",
            user_ip: `${req.ip}`

        });
        res.sendFile(__dirname+"/build/bundled/src/test-image.html");
    }else{
        console.log("user_hit");
        entry = log.entry( {
            get_request_origin: 'users browser',
            page_requested: "index.html",
            user_ip: `${req.ip}`
        });
        res.sendFile(__dirname+"/build/bundled/index.html");
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
app.get("/.well-known/acme-challenge/*",function(req,res){
    res.sendFile(__dirname+"/.well-known/acme-challenge/of1eUXz7kmh9DJuemNr_syW5emE5dpL-ydhkYu6Hv3M")
});

// Endpoint for user_id / image_id  
app.get("/tweetgallery/:user_id/:image_id",httpsredirect ,function(req,res){
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
        res.sendFile(__dirname+"/build/bundled/index.html");
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

function auth(req,res,next){
     if(req.query.pwd =="bluejay101"){
         next();
     }else{
        res.status(403).json({message:"you dont have access to this page"});
     }
    
}
//not serving just redirectig
function httpsredirect(req,res,next){
    console.log(req.subdomains);
    if(req.protocol=="http"){
        if(req.path=="/service-worker.js"){
            //logging stuff
            entry = log.entry({get_request_origin: 'user',page_requested: "index.html",reditect_to: "https", path:`${req.path}`,user_ip: `${req.ip}`});
            log.alert(entry, function(err, apiResponse) {
                if (!err) {
                    console.log("log entry: sucess");
                }else{
                    console.log(err);
                }
            });
           
        }else{
            //todo hard coded remove
            res.redirect('https://rumptweets.com'+`${req.path}`);
             //logging stuff
            entry = log.entry({get_request_origin: 'user',page_requested: "index.html",reditect_to: "https", path:`${req.path}`,user_ip: `${req.ip}`});
            log.info(entry, function(err, apiResponse) {
                if (!err) {
                    console.log("log entry: sucess");
                }else{
                    console.log(err);
                }
            });
        }
        
    }
    next();
}

// Start the server
//var httpsServer = https.createServer(credentials, app);
const PORT = process.env.PORT || 8080;

//TODO: Need to ensure that http redirects to https if not have to use app
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});