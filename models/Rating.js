const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    user: {
        type: Object,
        required: true,
    },
    participant: {
        type: Object,
        required: true,
    },
    value: {
        type: Number,
        required: true,
        min: 7,
        max: 10
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Rating', ratingSchema);