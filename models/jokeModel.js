var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var jokeModel = new Schema({
    joke: {
        type: String
    },
    jokeAddedDate: {
        type: Date,
        default: Date.now
    },
    updated:{
        type: Date,
        default: Date.now
    }
});

jokeModel.plugin(mongoosePaginate);

module.exports = mongoose.model('joke', jokeModel);