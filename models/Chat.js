const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    users: {
        type: Array,
        required: true,
    },
    lastMessage: {
        type: String,
        required: false,
        default:""
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Chat', chatSchema);