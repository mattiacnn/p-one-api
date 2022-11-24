const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    to: {
        type: Object,
        required: true,
    },
    from: {
        type: Object,
        required: true,
    },
    annotation:{
        type: String,
        required: false,
        default: "",
    },
    reason:{
        type: String,
        required: true,
        default: "",
    },
});

module.exports = mongoose.model('Report', reportSchema);