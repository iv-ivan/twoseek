var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
    text: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sharedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    datetime: String
});

mongoose.model('Post', PostSchema);
