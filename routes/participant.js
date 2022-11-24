const router = require('express').Router();
const Challenge = require("../models/Challenge");
const User = require("../models/User");
const Rating = require("../models/Rating");
const Participant = require("../models/Participant");
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');
const { Expo } = require('expo-server-sdk')

const verify = require('./verifyToken');
const vision = require('@google-cloud/vision');

router.post("/create", async (req, res) => {
    try {
        // Creates a client

        /*
        const client = new vision.ImageAnnotatorClient({
            keyFilename: "./vision_api_key.json"
        });

        const fileName = req.body.cover;

        // Performs safe search detection on the local file
        const [result] = await client.safeSearchDetection(fileName);
        const detections = await result.safeSearchAnnotation;
        console.log(detections)
        console.log('Safe search:');
        /*      console.log(`Detections: ${detections}`)
              console.log(`Adult: ${detections.adult}`);
              console.log(`Medical: ${detections.medical}`);
              console.log(`Spoof: ${detections.spoof}`);
              console.log(`Violence: ${detections.violence}`);
              console.log(`Racy: ${detections.racy}`);*/

        try {
            if ( detections && detections.adult === "VERY_LIKELY" || detections.adult === "LIKELY" || detections.violence === "VERY_LIKELY" || detections.violence === "LIKELY") {
                res.send("explicit content not accepted")
            }
            else {
                // getting the author
                const requestedToken = req.header('auth-token');
                const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
                const user = await User.findOne({ _id: token._id });

                const challenge = await Challenge.findOne({ _id: req.body.challenge_id });

                const verifyParticipant = await Participant.find({
                    "challenge._id": challenge._id,
                    "user._id": user._id,
                    "mediaType": req.body.mediaType
                });
                console.log(req.body.cover.replace("?", "_400x400?"))
                if (true) {
                    console.log("thumb is", req.body.thumbnail)
                    const newparticipant = await new Participant({
                        user: user,
                        challenge: challenge,
                        cover: req.body.cover,
                        description: req.body.description,
                        mediaType: req.body.mediaType,
                        thumbnail: req.body.thumbnail ? req.body.thumbnail : req.body.cover.replace("?", "_400x400?"),
                        width: req.body.width,
                        height: req.body.height,
                    });
                    await newparticipant.save();
                    res.status(200).send(newparticipant);
                    user.challenges.push(challenge._id);
                    await user.save()
                }
                else {
                    res.status(200).send({ error: "participant slot saturated" });
                }
            }
        } catch (error) {
            // getting the author
            const requestedToken = req.header('auth-token');
            const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
            const user = await User.findOne({ _id: token._id });

            const challenge = await Challenge.findOne({ _id: req.body.challenge_id });

            const verifyParticipant = await Participant.find({
                "challenge._id": challenge._id,
                "user._id": user._id,
                "mediaType": req.body.mediaType
            });
            console.log(req.body.cover.replace("?", "_400x400?"))

            if (!verifyParticipant.length) {
                console.log("thumb is", req.body.thumbnail)
                const newparticipant = await new Participant({
                    user: user,
                    challenge: challenge,
                    cover: req.body.cover,
                    description: req.body.description,
                    width: req.body.width,
                    height: req.body.height,
                    mediaType: req.body.mediaType,
                    thumbnail: req.body.thumbnail ? req.body.thumbnail : req.body.cover.replace("?", "_400x400?"),
                });
                await newparticipant.save();
                res.status(200).send(newparticipant);
                user.challenges.push(challenge._id);
                await user.save()
            }
            else {
                res.status(200).send({ error: "participant slot saturated" });
            }
        }

    }
    catch (error) {
        res.send(error)
        console.log(error)
    }
});


router.post("/retrieve", verify, async (req, res) => {
    try {

        String.prototype.toObjectId = function () {
            var ObjectId = (require('mongoose').Types.ObjectId);
            return new ObjectId(this.toString());
        };

        let participants = await Participant
            .aggregate([
                { "$match": { 'challenge._id': req.body.challenge_id.toObjectId() } },
                {
                    "$addFields": {
                        "didIRated": { "$in": [mongoose.Types.ObjectId(req.userId), "$ratings.user"] }
                    }
                }
            ]).sort("finalRating").exec();
        res.status(200).json(participants);
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});

router.post("/delete", verify, async (req, res) => {
    // getting the author
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);

    String.prototype.toObjectId = function () {
        var ObjectId = (require('mongoose').Types.ObjectId);
        return new ObjectId(this.toString());
    };

    console.log(req.body.participant_id.toObjectId())

    try {
        Participant.deleteOne({ _id: req.body.participant_id.toObjectId() }, function (err) {
            if (!err) {
                console.log("eliminato")
                res.send({ message: "Participant deleted" })

            }
            else {
                console.log("non eleiminatos")
            }
        });
    }
    catch (error) {
        console.log(error)
        res.send(error)
    }

});

router.post("/update", verify, async (req, res) => {
    // getting the author
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);

    try {
        const participant = await Participant.findOne({ _id: req.body.participant_id });

        if (req.body.cover)
            participant.cover = await req.body.cover;
        if (req.body.description)
            participant.description = await req.body.description;
        if (req.body.mediaType)
            participant.mediaType = await req.body.mediaType;
        if (req.body.thumbnail)
            participant.thumbnail = await req.body.thumbnail;

        await participant.save();

        const response = {
            message: "Participant updated",
            participant: participant
        }

        res.send(response);
    }
    catch (error) {
        console.log(error)
        res.send(error)
    }

});

router.post("/rate", verify, async (req, res) => {
    // getting the author
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    try {
        // get the participant
        const participant = await Participant.findOne({ _id: req.body.participant_id });
        // create a rating object
        const rating = await new Rating({
            user: user,
            participant: participant,
            value: req.body.value,
        });
        await rating.save();
        // assign rating to participant
        const assignedRating = { _id: rating._id, user: rating.user._id };
        await participant.ratings.push(assignedRating);
        // update total ratings
        participant.totalRatings = await participant.totalRatings + 1;
        // update final rating
        participant.finalRating = await (participant.finalRating + rating.value) / participant.totalRatings;
        // save the result
        await participant.save();

        try {
            let expo = new Expo();

            let messages = [];
            messages.push({
                to: participant.user.notificationToken,
                sound: 'default',
                title: 'Hai ricevuto un nuovo voto',
                body: '@' + user.username + ' ha votato ' + req.body.value + " il tuo post",
            });
            let chunks = expo.chunkPushNotifications(messages);
            let tickets = [];
            (async () => {
                for (let chunk of chunks) {
                    try {
                        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                        console.log(ticketChunk);
                        tickets.push(...ticketChunk);
                    } catch (error) {
                        console.error(error);
                    }
                }
            })();
        }
        catch (err) {
            console.log(err)
        }
        res.status(200).send(participant);
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});


module.exports = router;