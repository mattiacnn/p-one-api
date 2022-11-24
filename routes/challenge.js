const router = require('express').Router();
const Challenge = require("../models/Challenge");
const Participant = require("../models/Participant");
const User = require("../models/User");
const Comment = require("../models/Comment");
const jwt = require('jsonwebtoken');
const moment = require('moment')
const verify = require('./verifyToken');
const Category = require("../models/Category");

router.post("/create", verify, async (req, res) => {
    try {

        const requestedToken = req.header('auth-token');
        const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
        const user = await User.findOne({ _id: token._id });

        // cerca se ci sono slot liberi
        const challenges = await Challenge.find({ isActive: true });
        const challenge = await Challenge.findOne({ title: req.body.title });

        challenge.user = await user;

        if (challenges.length >= 4) {

            // metti la challenge in coda
            const counter = await Challenge.findOne({ isActive: false }).sort("quequeCounter");

            if (counter.quequeCounter >= 300000000) {
                challenge.quequeCounter = 1;
                await challenge.save()
            }
            else {
                challenge.quequeCounter = counter.quequeCounter + 1;
                await challenge.save()

            }
            res.status(200).send({ uploaded: true });
        }
        else {

            // pubblica la challenge
            challenge.isActive = true;
            challenge.startedAt = Date.now();
            challenge.endAt = moment(Date.now()).add(24, 'hours');

            await challenge.save();

            res.status(200).send(newChallenge);
        }

        user.winners.shift();
        await user.save();

    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});

router.post("/create-platform-challenge", async (req, res) => {
    try {

        const newPlatFormChallenge = await new Challenge({
            cover: req.body.cover,
            title: req.body.title,
            mediaType: req.body.mediaType,
            isScheduled: false,
            isActive: false,
            isFromPlatform: true,
            quequeCounter: 300000000,
            category: req.body.category,
            subCategory: req.body.subCategory
        });

        await newPlatFormChallenge.save();
        res.status(200).send(newPlatFormChallenge);

    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});


String.prototype.toObjectId = function () {
    var ObjectId = (require('mongoose').Types.ObjectId);
    return new ObjectId(this.toString());
};
router.post("/winners-new", verify, async (req, res) => {
    const winners = await Participant.find({ "challenge._id": req.body.challengeId.toObjectId(),/*totalRatings: { $gte: 10 }*/ }).sort("-finalRating").limit(3);
    res.send(winners);
    console.log(winners)
});
router.post("/participants", verify, async (req, res) => {
    const participants = await Participant.find({ "challenge._id": req.body.challengeId.toObjectId(), totalRatings: { $gte: 30 } }).sort("-finalRating");
    res.send(participants);
});



router.post("/winners", verify, async (req, res) => {
    const yesterday = moment().subtract(1, 'day').startOf('day');
    console.log(yesterday)
    // retrieve the latest visible challenge
    const challenge = await Challenge.findOne({
        startAt: {
            $gte: yesterday.toDate(),
            $lte: moment(yesterday).endOf('day').toDate()
        }
    })
    console.log("challenge", challenge)
    const winners = await Participant.find({ "challenge._id": challenge._id, totalRatings: { $gte: 10 } }).sort("-finalRating").limit(3);
    res.send(winners);
    const editedWinners = await Participant.updateMany({ "challenge._id": challenge._id, totalRatings: { $gte: 10 } }, { isWinner: true }).sort("-finalRating").limit(3);
});

router.post("/comments/retrieve", verify, async (req, res) => {
    const challenge = await Challenge.findOne({ _id: req.body._id });
    const comments = await Comment.find({ challenge: challenge._id });
    res.send(comments)
});

router.post("/comments/rate", verify, async (req, res) => {
    // getting the author
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    const comment = await Comment.findOne({ _id: req.body.commentId });
    comment.ratedFrom.push(user._id);
    await comment.save();

    const comments = await Comment.find({ challenge: comment.challenge._id });

    res.send(comments)
});

router.post("/comments/create", verify, async (req, res) => {
    // getting the author
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });
    const challenge = await Challenge.findOne({ _id: req.body._id }).sort("-endAt");

    const newComment = await new Comment({
        user: user,
        challenge: challenge._id,
        description: req.body.description,
    });

    newComment.save();
    console.log("created")
    res.status(200).send(newComment);
})

router.post("/categories", async (req, res) => {
    try {
        const categories = await Category.find({});
        res.status(200).send(categories)
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});

router.post("/retrieve-all", async (req, res) => {
    try {

        const challenges = await Challenge.find().sort("-endAt").limit(20);
        res.status(200).send(challenges)
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});

router.post("/retrieve-category", async (req, res) => {
    try {

        const challenges = await Challenge.find({ category: req.body.category, isActive: false });
        res.status(200).send(challenges)
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});

router.post("/podium", verify, async (req, res) => {
    const challenges = await Challenge.find().limit(8).sort("-endAt");
    res.send(challenges);
});

router.post("/retrieve", verify, async (req, res) => {
    try {

        const today = moment().startOf('day');

        // ottieni le challenge che non sono ancora scadute
        const challenges = await Challenge.find({
            endAt: {
                $gte: Date.now()
            },
            isActive: true
        });

        console.log("ho trovato", challenges.length, " già attive")

        // se sono almeno 4 mandale all'utente
        if (challenges.length >= 4) {
            console.log("invio 4 challenges perchè ci sono già")
            res.status(200).send(challenges);
        }

        // se sono meno di 4, prendi le restanti e rendile visibile, poi mandale
        else {
            console.log("Cerco le challenge nella coda")

            const _challenges = await Challenge.find({
                isActive: false,
            }).sort("quequeCounter").limit(4 - challenges.length);

            console.log("ho trovato", _challenges.length, " nella coda");

            if (_challenges.length >= (4 - challenges.length)) {

                _challenges.forEach(async (challenge) => {
                    challenge.isActive = true;
                    challenge.isScheduled = false;
                    challenge.startedAt = Date.now();
                    challenge.endAt = moment(Date.now()).add(24, 'hours');
                    await challenge.save();
                });

                const response = await _challenges.concat(challenges);

                res.status(200).send(response);

            }

            console.log("cerco le vecchie challenge");

            const updateOlderChallenges = await Challenge.find({ endAt: { $lte: Date.now() } }).sort("-endAt").limit(4 - challenges.length);

            if (updateOlderChallenges.length) {
                console.log("aggiorno le vecchie challenge");

                const counter = await Challenge.findOne({ isActive: false }).sort("-quequeCounter");

                updateOlderChallenges.forEach(async (challenge, index) => {
                    challenge.isActive = false;
                    challenge.isScheduled = false;
                    challenge.quequeCounter = counter.quequeCounter + (index + 1)
                    await challenge.save();
                });
            }
        }


    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});
module.exports = router;