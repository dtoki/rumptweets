var express = require('express');
var webshot = require('webshot');
var gcloud = require('google-cloud');
var storage = gcloud.storage;
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var fs = require('fs');
var app = express();


// Configure app
// If you want to pass the data using the application/x-www-form-urlencoded way
//app.use(bodyParser.json({extended:true}));
app.use(bodyParser.json());
app.use('/images',  express.static(__dirname + '/images'));

// Storage for google bucket
var gcs = storage({
    projectId: 'rumptweets-2c7cc',
    keyFilename: 'key/firebase_key.json'
});
var bucket = gcs.bucket('rumptweets-2c7cc.appspot.com');

// Load the html file
var $ = cheerio.load(fs.readFileSync('app/html/index.html','utf8'));
// Serve at port 8080
var port = process.env.PORT || 8080;
// Get ref to the express router
var router = express.Router();


// Middleware to use for all requests
router.use(function(req, res, next) {
    // Set the default headers configs
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Content-Type","application/json");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Serve the tweet
app.get('/', function(req, res) {
    //res.send($.html());
});

router.route('/gentweet')
    .post(function(req, res) {
        var userPost;
        userPost = req.body;
        //Upload file
        uploadToFirebaseStorage(userPost,function(data,publicUrl){
            res.json({downloadUrl: data.mediaLink, publicUrl: publicUrl});
        });
        
    });
function uploadToFirebaseStorage(userPost,myCallback){
    // TODO create /image_upload_repo/ folder if it's not yet created.
    // Folder needs to created to stream
     var file = fs.createWriteStream(__dirname+'/image_upload_repo/'+userPost.userId.toString()+'_and_'+userPost.imagePostId.toString() + '.png', {encoding: 'binary'});
    // Change words on tweet
    $('label.userInput').text(userPost.message.toString());
     var options = {
        siteType:'html',
        captureSelector:'#tweet_picture_container',
        defaultWhiteBackground:false,
        streamType:'png',
        windowSize:{ width: 1000
        , height: 768 },
    };
    //Take the picture with the options above
    var renderStream = webshot($.html(),options);
    renderStream.on('data', function(data) {
        //Write data to file
        file.write(data.toString('binary'), 'binary', function(err){
            if(err){
                console.log("error writing file to folder"+err);
            }
            console.log('writing file to folder...');
        });
    });
    //When the data ends then upload file
    renderStream.on('end', function(data){
        //options for file
        var options = {
            destination: 'server_upload_test/'+userPost.userId.toString()+'/'+userPost.imagePostId.toString()+'.png',
            public:true,
            validation: 'crc32c',
            metadata: {
                'fb:app_id': '',
                'og:title':'Rump Tweets',
                'og:description':'Tweet like the most powerful man in the world'
            }
        };
        //Upload file to bucket
        bucket.upload(__dirname+'/image_upload_repo/'+userPost.userId.toString()+'_and_'+userPost.imagePostId.toString()+ '.png', options, function(err, file, apiResponse) {
            if(!err){
                console.log('file upload complete');
                //TODO delete file after upload
               var publicUrl;
                var options = {
                    entity: 'allUsers',
                    role: gcs.acl.READER_ROLE
                };
                file.acl.add(options).then(function(data) {
                    //Log the self link useful to look at the meta data information.
                     //console.log(data[1]);
                    publicUrl = `https://storage.googleapis.com/${bucket.name}/${data[1].object}`;
                    //Make callback when the file is set
                    myCallback(file.metadata,publicUrl);
                   var metadata = {
                    metadata: {
                        'og:title':'Rump Tweets',
                        'og:description':'Tweet like the most powerful man in the world',
                        'og:image': publicUrl
                    }
                    };
                    file.setMetadata(metadata, function(err, apiResponse) {
                        if(err){
                            console.log("Error setting meta data file : " + err)
                        }
                    });
                });
                
            }
        });        
    });
}

// REGISTER OUR ROUTES --
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// ================
app.listen(port);
console.log('Serving at port: ' + port);
