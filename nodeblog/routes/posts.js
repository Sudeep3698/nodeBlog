var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var db = require('monk')('localhost/nodeblog');
//var multer = require('multer');

//var storage =   multer.diskStorage({
//  destination: function (req, file, callback) {
//    callback(null, './public/images/uploads');
//  },
//  filename: function (req, file, callback) {
//    callback(null, file.fieldname + '-' + Date.now());
//  }
//});
//var upload = multer({ storage : storage}).single('mainimage');

//router.get('/',function(req,res){
//      res.sendFile(__dirname + "/views/addpost.jade");
//});

//router.post('/add',function(req,res){
//    upload(req,res,function(err) {
//        if(err) {
//            res.send("Error uploading file.");
//        } else{
//        res.location('/');
//        res.redirect('/');
//        }
//    });
//});

// Get route for showing the details of the post
router.get('/show/:id', function(req, res, next){
    var posts = db.get('posts');
    posts.findOne(req.params.id, function(err, post){  // findOne is the monk function to get the id of the particular post
        res.render('show',{
              "post": post
        });
    });
});

router.get('/add', function(req, res, next){
    var categories = db.get('categories');       // Getting the categories from database

    categories.find({},{}, function(err, categories){
        res.render('addpost', {
          "title": "Add Post",
          "categories": categories
        });
    });
});

router.post('/add', function(req, res, next){
    // Get Form Values
    var title    = req.body.title;
    var category = req.body.category;
    var body     = req.body.body;
    var author   = req.body.author;
    var date     = new Date();

    if(req.files){
        var mainImageOriginalName   = req.files.mainimage.originalname;
        var mainImageName           = req.files.mainimage.name;
        var mainImageMime           = req.files.mainimage.mimetype;
        var mainImagePath           = req.files.mainimage.path;
        var mainImageExt            = req.files.mainimage.extension;
        var mainImageSize           = req.files.mainimage.size;
    } else {
        var mainImageName = 'noimage.png';
    }
    // Form Validation
    req.check('title', 'Title field is required').notEmpty();
    req.check('body', 'Body field is required');

    // Check Errors
    var errors = req.validationErrors();

    if (errors){
        res.render('addpost',{
            "errors": errors,
            "title": title,
            "body": body
        });
    } else {

      var posts = db.get('posts');

      // Submit to DB
      posts.insert({
          "title": title,
          "body": body,
          "category": category,
          "date": date,
          "author": author,
          "mainimage": mainImageName
      }, function(err, post){
          if(err){
              res.send('There was an issue submitting the post');
          } else {
              req.flash('success', 'Post Submitted');
              res.location('/');
              res.redirect('/');
          }
      });
    }
});

router.post('/addcomment', function(req, res, next){
    // Get Form Values
    var name        = req.body.name;
    var email       = req.body.email;
    var body        = req.body.body;
    var postid      = req.body.postid;
    var commentdate = new Date();

    // Form Validation
    req.check('name', 'Name field is required').notEmpty();
    req.check('email', 'Email field is required').notEmpty();
    req.check('email', 'Email is not formatted correctly').isEmail();
    req.check('body', 'Body field is required').notEmpty();

    // Check Errors
    var errors = req.validationErrors();

    if (errors){
        var posts = db.get('posts');
        posts.findOne(postid, function(err, post){
            res.render('show',{
                "errors": errors,
                "post": post
            });
        });

    } else {
        var comment = {"name": name, "email": email, "body": body, "commentdate": commentdate}  // declaring an Array of comments

        var posts = db.get('posts');

        posts.update({
                "_id": postid
            },
            {
                $push:{
                    "comments":comment
                }
            },
            function(err, doc){    // these are embedded documents, each post is a embedded document which consist of comments in the particular post
                if(err){
                    throw err;
                } else {
                    req.flash('success', 'Comment Added');
                    res.location('/posts/show/'+postid);
                    res.redirect('/posts/show/'+postid);
                }
            }
        );
    }
});

module.exports = router;
