var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var User = mongoose.model('User');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Twoseek', user: req.user ? req.user : null });
});

router.get('/login/vk', passport.authenticate('vkontakte', {scope : ['friends', 'offline']}));

router.get('/login/vk/return', 
    passport.authenticate('vkontakte', { failureRedirect: '/auth/fail', successRedirect: '/auth/success'}));

router.get('/auth/success', function(req, res) {
        res.render('after-auth', { state: 'success', user: req.user ? req.user : null });
    });

router.get('/auth/fail', function(req, res) {
        res.render('after-auth', { state: 'fail', user: null });
    });


router.delete('/auth', function(req, res) {  
    req.logout();
    res.writeHead(200);
    res.end()
});

router.get('/posts', function(req, res, next) {
    User.findById(req.user["_id"], function(err, user) {
        if (user) {
            user.populate("friends", function (err, user) {
                AllPosts = [];
                friendsNum = user.friends.length;
                if (friendsNum == 0)
                    res.json([]);
                for (var i = 0; i < user.friends.length; ++i) {
                    user.friends[i].populate("posts", function (err, friend) {
                        postsNum = friend.posts.length;
                        for (var j = 0; j < postsNum; ++j) {
                            var postToAdd = friend.posts[j].toObject();
                            postToAdd.owner = [friend.name, friend.userId];
                            delete postToAdd.__v;
                            delete postToAdd.sharedTo;
                            delete postToAdd.likedBy;
                            AllPosts.push(postToAdd);
                        }
                        friendsNum -= 1;
                        if (friendsNum == 0) {
                            res.json(AllPosts);
                        }
                    });
                }
            });
        } else
            return next(err);
    }
    );
});

router.get('/my_posts', function(req, res, next) {
    User.findById(req.user["_id"], function(err, user) {
        if (user) {
            user.populate("posts", function (err, user) {
                res.json(user.posts);
            });
        } else
            return next(err);
    }
    );
});

router.post('/posts', function(req, res, next) {
    User.findById(req.user["_id"], function(err, user) {
        if (user) {
            var post = new Post(req.body);
            post.owner = user;
            post.save(function(err, post){
                if(err){ return next(err); }
            });
            user.posts.push(post);
            user.save(function(err, user){
                if(err){ return next(err); }
            });
            res.json(post);
        } else
            return next(err);
    }
    );
});

module.exports = router;
