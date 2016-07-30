var passport = require('passport');
var VKStrategy = require('passport-vkontakte').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new VKStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://twoseek.tk/login/vk/return',
    profileFields: [
        'id',
        'displayName',
        'picture'
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
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
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
