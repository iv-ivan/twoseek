var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var User = mongoose.model('User');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Twoseek', user: req.user ? req.user : null });
});

router.get('/login/vk', passport.authenticate('vkontakte', {scope : 'user_friends'}));

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
    Post.find(function(err, posts){
        if(err){ return next(err); }
        res.json(posts);
    });
});

router.post('/posts', function(req, res, next) {
    var post = new Post(req.body);
    post.save(function(err, post){
        if(err){ return next(err); }
        res.json(post);
    });
});

module.exports = router;
