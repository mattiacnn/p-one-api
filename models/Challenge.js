const mongoose = require('mongoose');
const Winner = require("./Winner");
const Participant = require("./Participant");
const User = require("./User");

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        max: 20,
    },
    user: {
        type: Object,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    endAt: {
        type: Date,
        required: false
    },
    startedAt: {
        type: Date,
        required: false,
    },
    participants: {
        type: Array,
        required: false,
        default: []
    },
    cover: {
        type: String,
        required: true
    },
    isScheduled: {
        type: Boolean,
        required: false,
        default: false
    },
    isActive: {
        type: Boolean,
        required: false,
        default: false
    },
    mediaType: {
        type: String,
        required: true,
        defaul: "image"
    },
    quequeCounter: {
        type: Number,
        required: false
    },
    category: {
        type: String,
        required: false,
        default: ""
    },
    subCategory: {
        type: String,
        required: false,
        default: ""
    }
});

challengeSchema.post('save', async (doc) => {
    if (doc.isActive === false) {
        console.log("*****************************");

        // CHECK FOR WINNERS
        const winners = await Winner.find({ challenge: doc._id.toString() });
        if (!winners.length) {
            // assign winners
            const participant = await Participant.find({
                "challenge._id": doc._id
            }).limit(3).sort("-finalRating");

            participant.forEach(async (element, index) => {
                const newWinner = new Winner({
                    challenge: doc._id,
                    description: element.description ? element.description : "",
                    cover: element.cover,
                    finalRating: element.finalRating,
                    totalRatings: element.totalRatings,
                    mediaType: element.mediaType,
                    thumbnail: element.thumbnail,
                    user: element.user._id
                });
                await newWinner.save();

                if (index === 0) {
                    const user = await User.findOne({ _id: element.user._id });
                    user.winners.push(user._id);
                    await user.save();
                }
            });
        }
    }
});

module.exports = mongoose.model('Challenge', challengeSchema);