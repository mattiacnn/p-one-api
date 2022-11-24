const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: Object,
        required: true,
    },
    challenge: {
        type: Object,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    ratedFrom: {
        type: Array,
        required: false,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Comment', commentSchema);