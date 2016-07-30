var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
    userId: {type: String, lowercase: true, unique: true},
    name: String,
    vkToken: String,
    picture: String,
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

UserSchema.methods.generateJWT = function() {
    // set expiration to 365 days
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 365);

    return jwt.sign({
        _id: this._id,
        userId: this.userId,
        exp: parseInt(exp.getTime() / 1000),
    }, process.env.JWT_SECRET);
};

mongoose.model('User', UserSchema);
