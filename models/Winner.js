const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
    challenge: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    finalRating: {
        type: Number,
        required: true
    },
    totalRatings: {
        type: Number,
        required: true
    },
    mediaType: {
        type: String,
        required: false
    },
    thumbnail:{
        type: String,
        required:false
    },
    userHasPosted: {
        type: Boolean,
        required: false,
        default: false
    },
    cover: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
        default:""
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});



module.exports = mongoose.model('Winner', winnerSchema);