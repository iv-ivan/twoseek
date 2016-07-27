var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
    text: String,
    owner: String,
    isLiked: false,
    datetime: String
});

mongoose.model('Post', PostSchema);
