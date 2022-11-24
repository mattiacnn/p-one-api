const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    user: {
        type: Object,
        required: true,
    },
    challenge: {
        type: Object,
        required: true,
    },
    finalRating: {
        type: Number,
        required: false,
        default: 0
    },
    totalRatings: {
        type: Number,
        required: false,
        default: 0
    },
    ratings: {
        type: Array,
        required: false,
        default: []
    },
    cover: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        max: 30,
        default: ""
    },
    mediaType: {
        type: String,
        required: true,
        default: "image" // or video
    },
    thumbnail: {
        type: String,
        required: false,
        default: ""
    },
    isWinner: {
        type: Boolean,
        required: false,
        default: false
    },
    width: {
        type: Number,
        required: true,
    },
    height: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    x: {
        type: Number,
        required: false,
    },
    y: {
        type: Number,
        required: false,
    },
    color: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('participant', participantSchema);