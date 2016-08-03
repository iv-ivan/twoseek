var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var User = mongoose.model('User');

router.param('post', function(req, res, next, _id) {
    var query = Post.findById(_id);

    query.exec(function (err, post){
        if (err) { return next(err); }
        if (!post) { return next(new Error('can\'t find post')); }

        req.post = post;
        return next();
    });
});

router.param('user', function(req, res, next, _id) {
    var query = User.findById(_id);

    query.exec(function (err, sharingUser){
        if (err) { return next(err); }
        if (!sharingUser) { return next(new Error('can\'t find user')); }

        req.sharingUser = sharingUser;
        return next();
    });
});

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
                            if (friend.posts[j].sharedTo.indexOf(req.user["_id"]) == -1)
                                delete postToAdd.owner;
                            if (postToAdd.likedBy.indexOf(req.user["_id"]) != -1)
                                postToAdd.isLiked = true;
                            else
                                postToAdd.isLiked = false;
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
    });
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

router.put('/posts/:post/like', function(req, res, next) {
    if (req.post.likedBy.indexOf(req.user["_id"]) == -1 && req.post.sharedTo.indexOf(req.user["_id"]) == -1) {
        req.post.likedBy.push(req.user["_id"]);
        req.post.save(function(err, post){
            if (err) { return next(err); }
            res.send(200);
        });
    } else
        res.send(200);
});

router.put('/posts/:post/share/:user', function(req, res, next) {
    num_like = req.post.likedBy.indexOf(req.sharingUser["_id"]);
    if (num_like == -1)
        return next('500');
    else {
        req.post.likedBy.splice(num_like, 1);
        req.post.sharedTo.push(req.sharingUser["_id"]);
        req.post.save(function(err, post){
            if (err) { return next(err); }
            res.send(200);
        });
    }
});

router.get('/friends', function(req, res, next) {
    myFriends = [];
    l = req.user.friends.length;
    for (var j = 0; j < req.user.friends.length; ++j) {
        User.findById(req.user.friends[j], function(err, friend) {
            if (friend) {
                jsonedFriend = friend.toObject();
                delete jsonedFriend.__v;
                delete jsonedFriend.vkToken;
                delete jsonedFriend.friends;
                delete jsonedFriend.posts;
                delete jsonedFriend.likeYours;
                delete jsonedFriend.shareToYou;
                myFriends.push(jsonedFriend);
            } else
                return next(err);
            l -= 1;
            if (l == 0) {
                res.json(myFriends);
            }
        });
    }
});

module.exports = router;
