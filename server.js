var express = require('express');
var webshot = require('webshot');
var gcloud = require('google-cloud');
var storage = gcloud.storage;
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var fs = require('fs');
var app = express();


//Configure app
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use('/images',  express.static(__dirname + '/images'));
//Load the html file
var $ = cheerio.load(fs.readFileSync('app/html/index.html','utf8'));



var port = process.env.PORT || 8080;

var router = express.Router();

// Enable Storage
var gcs = storage({
    projectId: 'rumptweets-2c7cc',
    keyFilename: 'key/firebase_key.json'
});
var bucket = gcs.bucket('rumptweets-2c7cc.appspot.com');



// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    //console.log('Something is happening.');
    //Need to auth user
    // Website you wish to allow to connect
    router.setHeader('Access-Control-Allow-Origin', '*');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
app.get('/', function(req, res) {
    //res.json({ message: 'hooray! welcome to our api!' });
    res.send($.html());
    // res.json({your_imagePostId: req.body.imagePostId });
    // console.log(res.body);
});

var userPost;
router.route('/gentweet')

    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {
        userPost = req.body;
       
        uploadToFirebaseStorage(userPost,function(data){
            //res.json(data);
            res.json({downloadUrl: data.mediaLink});
        });
        //Send back the status and location of the upload
        
    });
function uploadToFirebaseStorage(userPost,myCallback){
    //Create file stream to upload
     var file = fs.createWriteStream(__dirname+'/image_upload_repo/'+userPost.userId.toString()+'_and_'+userPost.imagePostId.toString() + '.png', {encoding: 'binary'});
     var options = {
        siteType:'html',
        captureSelector:'#tweet_picture_container',
        defaultWhiteBackground:false,
        streamType:'png',
        windowSize:{ width: 1000
        , height: 768 },
    };
    //Change words on tweet
    $('label.userInput').text(userPost.message.toString());
    //Take the picture withe the options above
    var renderStream = webshot($.html(),options);
    // Bug this is called twice
    renderStream.on('data', function(data) {
        //Write data to file
        file.write(data.toString('binary'), 'binary', function(err){
            if(err){
                console.log(err);
            }
            console.log('written file to folder...');
        });
    });
    //Wen the data ends then upload file
    renderStream.on('end', function(data){
        //option for file
        var options = {
            destination: 'server_upload_test/'+userPost.userId.toString()+'/'+userPost.imagePostId.toString()+'.png',
            resumable: true,
            public:true,
            validation: 'crc32c',
            metadata: {
                event: ''
            }
        };
        //upload file to bucket
        bucket.upload(__dirname+'/image_upload_repo/'+userPost.userId.toString()+'_and_'+userPost.imagePostId.toString()+ '.png', options, function(err, file, apiResponse) {
            if(!err){
                console.log('file upload complete');
                //console.log(apiResponse);
                myCallback(file.metadata);
            }
        });        
    });

}

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
