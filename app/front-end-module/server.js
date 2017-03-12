'use strict';
var express = require('express');
var app = express();
var fs = require('fs');
var cheerio = require('cheerio');
// Use the built-in express middleware for serving static files from './public'
app.use("/bower_components",express.static(__dirname+'/build/bundled/bower_components'));
app.use("/src",express.static(__dirname+'/build/bundled/src'));
app.use("/images",express.static(__dirname+'/build/bundled/images'));
var facebookHtml = cheerio.load(fs.readFileSync('src/facebook-image.html','utf8'));

// / endpoint
app.get("/",function(req,res){
    
    app.use(express.static(__dirname+'/build/bundled/'));
    if(req.get('User-Agent').indexOf("facebookexternalhit")!=-1){
        console.log("facebookhit");
        res.sendFile(__dirname+"/build/bundled/src/test-image.html");
    }else{
        console.log("userhit");
        res.sendFile(__dirname+"/build/bundled/index.html");
    }
    
});

// Endpoint for user_id / image_id  
app.get("/tweetgallery/:user_id/:image_id", function(req,res){
 
    if(req.get('User-Agent').indexOf("facebookexternalhit")!=-1){
        console.log("facebook-hit");
        var protocol=req.protocol
        var hostname=req.hostname
        var ogUrl = protocol + "://" + hostname + + "/tweetgallery" + "/" + req.params.user_id + "/" + req.params.image_id;
        var imgUrl = protocol + "://" + "storage.googleapis.com/rumptweets-2c7cc.appspot.com/upload_folder" + "/" + req.params.user_id + "/" + req.params.image_id + ".png";
        facebookHtml("#ogUrl").attr('content',ogUrl);
        facebookHtml("#imgUrl").attr('content',imgUrl);
        facebookHtml("#imageUrl2").attr('src',imgUrl);
        // Change the app id based on the hostname
        if(hostname.indexOf("appspot")!=-1){
            //Found
            facebookHtml("#fbAppId").attr('id',"228591024275517");
        }else{
            //NotFound
            facebookHtml("#fbAppId").attr('id',"221420734992546");
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



// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});