var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    userId: {type: String, unique: true},
    name: String,
    vkToken: String,
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});

mongoose.model('User', UserSchema);
