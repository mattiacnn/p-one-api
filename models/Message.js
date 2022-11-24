const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    chat: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: false,
        default:""
    },
    post: {
        type: Object,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Message', messageSchema);