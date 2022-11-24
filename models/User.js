const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false,
        max: 20,
    },
    username: {
        type: String,
        required: true,
        max: 20,
    },
    notificationToken: {
        type: String,
        required: false,
        default: null,
    },
    bio: {
        type: String,
        required: false,
        default: "",
        max: 20,
        min: 6
    },
    challenges: {
        type: Array,
        required: false,
        default: []
    },
    password: {
        type: String,
        required: true,
        max: 1500,
        min: 6
    },
    avatar: {
        type: String,
        required: false,
        default: "https://banner2.cleanpng.com/20181231/fta/kisspng-computer-icons-user-profile-portable-network-graph-circle-svg-png-icon-free-download-5-4714-onli-5c2a3809d6e8e6.1821006915462707298803.jpg"
    },
    userBlocked: {
        type: Array,
        required: false,
        default: []
    },
    date: {
        type: Date,
        default: Date.now
    },
    authtType: {
        type: String, // facebook or standard
        require: false,
        default: "standard"
    },
    followed: {
        type: Array,
        required: false,
        default: []
    },
    followers: {
        type: Array,
        required: false,
        default: []
    },
    winners: {
        type: Array,
        required: false,
        default: []
    },

});



module.exports = mongoose.model('User', userSchema);