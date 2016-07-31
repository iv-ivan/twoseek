var https = require("https");
var passport = require('passport');
var VKStrategy = require('passport-vkontakte').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new VKStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://twoseek.tk/login/vk/return',
    scope: "friends",
    profileFields: [
        'id',
        'displayName'
    ]},
    function(accessToken, refreshToken, profile, done) {
        User.findOne({
            'userId': profile.id 
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                user = new User({
                    userId: profile.id,
                    name: profile.displayName,
                    picture: profile.picture,
                    vkToken: accessToken,
                    friends: []
                });
                var req = https.get("https://api.vk.com/method/friends.get?access_token=" + accessToken, function(res) {
                    res.setEncoding('utf8');
                    res.on('data', function(data) {
                        allFriendsIds = JSON.parse(data)["response"];
                        for (i in allFriendsIds) {
                            User.findOne({
                                'userId': allFriendsIds[i]
                            }, function(err, friendUser) {
                                if(friendUser) {
                                    friendUser.friends.push(user._id);
                                    friendUser.save(function(err) {
                                        if (err) console.log(err);
                                    });
                                    user.friends.push(friendUser._id);
                                    user.save(function(err) {
                                        if (err) console.log(err);
                                    }); 
                                }
                            });
                        }
                    });
                });

                req.on('error', function(err) {
                    return done(err, null);
                });

                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                var req = https.get("https://api.vk.com/method/friends.get?access_token=" + user.vkToken, function(res) {
                    res.setEncoding('utf8');
                    res.on('data', function(data) {
                        allFriendsIds = JSON.parse(data)["response"];
                        //remove unfriended
                        for(var i = 0; i < user.friends.length; ++i) {
                            User.findById(user.friends[i], function (err, friendUser) {
                                if (allFriendsIds.indexOf(friendUser.userId) == -1) {
                                    friendUser.friends.splice(friendUser.friends.indexOf(user._id), 1);
                                    friendUser.save(function(err) {
                                        if (err) console.log(err);
                                    });
                                }
                            }); 
                        }
                        //add friended
                        user.friends = [];
                        for (i in allFriendsIds) {
                            User.findOne({
                                'userId': allFriendsIds[i]
                            }, function(err, friendUser) {
                                if(friendUser) {
                                    friendUser.friends.push(user._id);
                                    friendUser.save(function(err) {
                                        if (err) console.log(err);
                                    });
                                    user.friends.push(friendUser._id);
                                    user.save(function(err) {
                                        if (err) console.log(err);
                                    });
                                }
                            })
                        }
                    });
                });
                return done(err, user);
            }
        }); 
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});
