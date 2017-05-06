const router = require('express').Router()
express = require('express'),
path = require('path'),
cheerio = require("cheerio"),
fs = require("fs");


//load facebook html
const facebookHtml = cheerio.load(fs.readFileSync(__dirname+'/../src/facebook-image.html','utf8'));
var log;

//init google services
initGoogleServices();

router.get("/", httpRedirect , ( req, res) => {
     //router.use(express.static(__dirname+'/build/default/'));
     //TODO: refactor this
    if(req.get('User-Agent').indexOf("facebookexternalhit")!=-1){
        //Log 
        console.log("facebook_hit");
        entry = log.entry( {
            get_request_origin: 'facebook bot',
            page_requested: "test-image.html",
            user_ip: `${req.ip}`

        });
        res.sendFile(path.resolve(__dirname+"/../build/default/index.html"));
    }else{
        console.log("user_hit");
        entry = log.entry( {
            get_request_origin: 'users browser',
            page_requested: "index.html",
            user_ip: `${req.ip}`
        });
        res.sendFile(path.resolve(__dirname+"/../build/default/index.html"));
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


router.get("/?(home|aboutus|privacy)", httpRedirect , ( req, res) => {
     //router.use(express.static(__dirname+'/build/default/'));
     //TODO: refactor this
    if(req.get('User-Agent').indexOf("facebookexternalhit")!=-1){
        //Log 
        console.log("facebook_hit");
        entry = log.entry( {
            get_request_origin: 'facebook bot',
            page_requested: "test-image.html",
            user_ip: `${req.ip}`

        });
        res.sendFile(path.resolve(__dirname+"/../build/default/index.html"));
    }else{
        console.log("user_hit");
        entry = log.entry( {
            get_request_origin: 'users browser',
            page_requested: "index.html",
            user_ip: `${req.ip}`
        });
        res.sendFile(path.resolve(__dirname+"/../build/default/index.html"));
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

//tweetgalary route
router.get("/tweetgallery/:user_id/:image_id", httpRedirect, function(req,res){
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
        //res.sendFile(__dirname+"/../build/default/index.html");
        res.sendFile(path.resolve(__dirname+"/../build/default/index.html"));
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

function httpRedirect(req,res,next){
    //if not secure or www is present
    if(req.subdomains[0]=="www" || req.get('X-Forwarded-Proto') == 'http'){
        console.log("redirecting to secure site");
        res.redirect("https://rumptweets.com");
    }
    next();
}

function initGoogleServices(){
    var logging;
    if(process.argv[2]=="-d"){
        //Gcloud logging
        logging = require('@google-cloud/logging')({
            projectId: 'rumptweets-2c7cc',
            keyFilename: __dirname + '/../keys/app_engine_key.json'
        });
    }else{
        //Gcloud logging
        logging = require('@google-cloud/logging')();
    }
    log = logging.log('syslog');
}

module.exports = router;