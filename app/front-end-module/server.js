'use strict';
var express = require('express');
var app = express();
var fs = require('fs');
var cheerio = require('cheerio');
var https = require("https");

//Load the certificates
var certificate = fs.readFileSync("sslcert/signed.pem","utf8");
var privateKey = fs.readFileSync("sslcert/domain.pem","utf8");
// Put credentials in object
var credentials = { key: privateKey, cert: certificate}
// Start the server
var httpsServer = https.createServer(credentials, app);
const PORT = process.env.PORT || 8080;
httpsServer.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});


// Use the built-in express middleware for serving static files from './public'
app.use("/bower_components",express.static(__dirname+'/build/bundled/bower_components'));
app.use("/src",express.static(__dirname+'/build/bundled/src'));
app.use("/images",express.static(__dirname+'/build/bundled/images'));
app.use(express.static(__dirname+'/.well-known/acme-challenge'));
var facebookHtml = cheerio.load(fs.readFileSync('src/facebook-image.html','utf8'));

// / endpoint
app.get("/", function(req,res){
    
    app.use(express.static(__dirname+'/build/bundled/'));
    if(req.get('User-Agent').indexOf("facebookexternalhit")!=-1){
        console.log("facebookhit");
        res.sendFile(__dirname+"/build/bundled/src/test-image.html");
    }else{
        console.log("userhit");
        res.sendFile(__dirname+"/build/bundled/index.html");
    }
    
});

// Validate using acme challenge
// app.get("/.well-known/acme-challenge/",function(req,res){
//     res.sendfile(__dirname+"/.well-known/acme-challenge/Wycl1z7k3AkoPqJykFzbd4Sg4N5r8NGsEXqVX0SvhJc")
// });

// Endpoint for user_id / image_id  
app.get("/tweetgallery/:user_id/:image_id", function(req,res){
    if(req.get('User-Agent').indexOf("facebookexternalhit")!=-1){
        console.log("facebook-hit");
        var protocol=req.protocol
        var hostname=req.hostname
        var ogUrl = "https" + "://" + hostname + + "/tweetgallery" + "/" + req.params.user_id + "/" + req.params.image_id;
        var imgUrl = "https" + "://" + "storage.googleapis.com/rumptweets-2c7cc.appspot.com/upload_folder" + "/" + req.params.user_id + "/" + req.params.image_id + ".png";
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
    }else{

        console.log("user-hit");
        res.sendFile(__dirname+"/build/bundled/index.html");
    }
   
});

function auth(req,res,next){
     if(req.query.pwd =="bluejay101"){
         next();
     }else{
        res.status(403).json({message:"you dont have access to this page"});
     }
    
}