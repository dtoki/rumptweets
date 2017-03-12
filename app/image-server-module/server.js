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

//Get the 3rd argument passed in
var arg2= process.argv[2];
var gcs;
//If on dev machine auth using the passed in credentials
(arg2=="-dev") ? gcs = storage({
    projectId: 'rumptweets-2c7cc',
    keyFilename: 'key/firebase_key.json'
}) : gcs = storage();

//Connect to this bucket
var bucket = gcs.bucket('rumptweets-2c7cc.appspot.com');

// Load the html file
var $ = cheerio.load(fs.readFileSync('html/index.html','utf8'));
var facebookHtml = cheerio.load(fs.readFileSync('html/tweetPlaceHolder.html','utf8'));
// Serve at port 8081
var port = process.env.PORT || 8081;
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
    //res.send(facebookHtml.html());
});

//Gentweet api
router.route('/gentweet')
    .post(function(req, res) {
        var userPost;
        userPost = req.body;
        //Upload file
        createUploadFolder((folderCreated)=>{
            //Log if creating the folder was successful or not;
            (folderCreated)? console.log("File system created folder"):console.log("File system could not create folder");
            //Start upload process if the folder was created
            (folderCreated)?uploadToFirebaseStorage(userPost, function(data,publicUrl,fileName){
                res.json({downloadUrl: data.mediaLink, publicUrl: publicUrl});
                //Delete file
                fs.unlink(__dirname+fileName,(err)=>{
                    (!err)?console.log("Successfully deleted file"):console.log("Encountered error while deleting file "+err);
                });
            }): res.sendStatus(500).json({message: "internal server error creating temp upload folder"});
        });
        
    });
//Create folder
function createUploadFolder(myCallback){
    //Check if folder exists.. if it does not create it
    fs.access(__dirname+"/image_upload_repo",fs.constants.F_OK,(err)=>{
        if(err){
            console.log("creating image_upload_repo folder...");
            fs.mkdir(__dirname+"/image_upload_repo",(err)=>{   
                myCallback((err==null)?true:false);
            });
        }else{
            console.log("folder exsists");
            myCallback(true);
        };
    });
}

//Upload to firebase
function uploadToFirebaseStorage(userPost,myCallback){
    // Folder needs to created to stream
    try {
        var file = fs.createWriteStream(__dirname+'/image_upload_repo/'+userPost.userId.toString()+'_and_'+userPost.imagePostId.toString() + '.png', {encoding: 'binary'});
    } catch (error) {
        console.log("Error creating file " +error);
    }

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
    
    //Write the data into the file
    renderStream.on('data', function(data) {
        //Write data to file
        try {
            file.write(data.toString('binary'), 'binary', function(err){
                if(err){
                    console.log("error writing file to folder"+err);
                }
                console.log('writing file to folder...');
            });
        } catch (error) {
            console.log("error writing file"+ error);
        }
        
    });

    //When the data write ends ends then upload file
    renderStream.on('end', function(data){
        //Close the file write stream if not when you try to open again gigi
        file.end();
        //options to use to create the file
        var folderLocation;
        (arg2=="-dev")? folderLocation = "upload_folder_dev/" : folderLocation = "upload_folder/";
        var options = {
            destination: folderLocation + userPost.userId.toString()+ '/' + userPost.imagePostId.toString() + '.png',
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
                    //Make callback when the file is set withe the download url, public url and local path to the file
                    myCallback(file.metadata,publicUrl,'/image_upload_repo/'+userPost.userId.toString()+'_and_'+userPost.imagePostId.toString() + '.png');
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
