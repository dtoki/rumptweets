const router = require('express').Router(),
cheerio = require("cheerio"),
webshot = require('webshot'),
fs = require("fs"),
cors = require("cors");

var $;
var gcs;
var bucket;
//init variables above
init();

router.route('/gentweet')
    .post(function(req, res) {
        var corsFn = cors();
        corsFn(req, res, function() {
            var userPost;
            userPost = req.body;
            uploadFile(userPost,(sucess)=>{
            if(sucess.image_generation =="success"){
                console.log("File uploaded");
                res.json({downloadUrl: sucess.downloadUrl.mediaLink, publicUrl: sucess.publicUrl});
            }else{
                console.log("File not uploaded");
                res.status(500).json({message:"Internal server serror please see logs"});
            }
            
            });
        });
});
//upload file to cloud
function uploadFile(userPost,callback){
    //Create a file using the passed in details
    var file = bucket.file(`upload_folder/${userPost.userId}/${userPost.imagePostId}.png`);
    //Send back file url while it uploads
    $('label.userInput').text(userPost.message.toString());
     var options = {
        siteType:'html',
        quality: 100,
        captureSelector:'#tweet_picture_container',
        defaultWhiteBackground:false,
        streamType:'png',
        windowSize:{ width: 1000
        , height: 768 },
    };
    //Take the picture with the options above
    var renderStream = webshot($.html(),options);
    renderStream.pipe(file.createWriteStream({ 
      resumable:false,
       metadata: {
        contentType: 'image/png'}
      }))
      .on('error', function(err) {callback(false);})
      .on('finish', function() {
        // The file upload is complete.
         file.acl.add({
              entity: 'allUsers',
              role: gcs.acl.READER_ROLE
          }).then(function(data) {
           callback({
                image_generation: "success",
                downloadUrl: file.metadata,
                publicUrl: `https://storage.googleapis.com/${bucket.name}/${data[1].object}`
             })
         }).catch(function(e){
           console.log("An error occured while uploading the file" + e);
            callback({
               image_generation: "fail"
            });
         });
    });
}
//int variables
function init(){
    $ = cheerio.load(fs.readFileSync(__dirname + '/../html/index.html','utf8'));
    (process.argv[2]=="-d")? gcs = require('@google-cloud/storage')({
        projectId: 'rumptweets-2c7cc',
        keyFilename: __dirname + '/../key/firebase_key.json'
    }):gcs = require('@google-cloud/storage')();
    bucket =  gcs.bucket('rumptweets-2c7cc.appspot.com');
}

module.exports = router;