const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Participant = require("../models/Participant");
const Report = require("../models/Report");
const Challenge = require("../models/Challenge");
const verify = require('./verifyToken');
const Chat = require("../models/Chat");

// get a user
router.get('/', verify, async (req, res) => {
    console.log("called")
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    res.status(200).send(JSON.stringify(user));
});

// search a user
router.post('/search', verify, async (req, res) => {
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    const blockedId = await user.userBlocked.map(item => item._id);

    if (req.body.isChallenge === true) {
        Challenge.find({ "title": { "$regex": req.body.username, "$options": "i" }, "_id": { $nin: blockedId } },
            (error, data) => {
                if (!error) {
                    res.send(data)
                }
                else {
                    res.send(error);
                }
            }).limit(20)
    }
    else {
        User.find({ "username": { "$regex": req.body.username, "$options": "i" }, "_id": { $nin: blockedId } },
            (error, data) => {
                if (!error) {
                    res.send(data)
                }
                else {
                    res.send(error);
                }
            }).limit(20)
    }

});

router.post("/particpants", verify, async (req, res) => {
    String.prototype.toObjectId = function () {
        var ObjectId = (require('mongoose').Types.ObjectId);
        return new ObjectId(this.toString());
    };

    const particpants = await Participant.find({ "user._id": req.body._id.toObjectId() }).sort("-createdAt");
    res.status(200).send(particpants);
});

router.post("/challenges-with-me", verify, async (req, res) => {
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    const challenges = await Challenge.find({ _id: { "$in": user.challenges } })
    res.status(200).send(challenges);
})

router.post("/my-particpants", verify, async (req, res) => {
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    const particpants = await Participant.find({ "user._id": user._id }).sort("-createdAt");
    res.status(200).send(particpants);
});


router.post('/update/notificationToken', verify, async (req, res) => {
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });


    User.findOneAndUpdate({ _id: user._id }, { notificationToken: req.body.notificationToken }, { new: true }, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
            res.status(400).send('error')
        }
        else {
            console.log(doc);
            res.status(200).send(doc)
        }
    });
});
// update profile fields
router.post('/update', verify, async (req, res) => {
    console.log('start')
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    const fieldsToEdit = req.body.fieldsToEdit;

    User.findOneAndUpdate({ _id: user._id }, fieldsToEdit, { new: true }, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
            res.status(400).send('error')
        }
        else {
            console.log(doc);
            res.status(200).send(doc)
        }
    });
});

// report profile
router.post('/report', verify, async (req, res) => {
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    try {
        const report = await new Report({
            to: req.body.to,
            from: req.body.from,
            reason: req.body.reason,
            annotation: req.body.annotation
        });

        await report.save();

        const response = {
            message: "user reported",
            report: report
        }

        res.send(response);
    }
    catch (error) {
        console.log(error)
        res.send(error);
    }

});

// block user
router.post('/block', verify, async (req, res) => {
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    try {
        console.log(token._id)

        const userToBlock = await User.findOne({ _id: req.body.userToBlock })
        user.userBlocked.push(userToBlock);

        await user.save();

        const response = {
            message: "user blocked",
            userBlocked: userToBlock
        }

        res.send(response);
    }
    catch (error) {
        console.log(error)
        res.send(error);
    }

});

// block user
router.post('/unlock', verify, async (req, res) => {
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    try {

        String.prototype.toObjectId = function () {
            var ObjectId = (require('mongoose').Types.ObjectId);
            return new ObjectId(this.toString());
        };

        const filtered = await user.userBlocked.filter((item) => {
            return item._id.toString() !== req.body.userToUnlock;
        });

        user.userBlocked = await filtered;

        await user.save();

        const response = {
            message: "user unlocked",
            userBlocked: filtered
        }

        res.send(response);
    }
    catch (error) {
        console.log(error)
        res.send(error);
    }

});

router.post('/followed', verify, async (req, res) => {

    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });

    try {
        const followed = await User.find({ _id: { "$in": user.followed } });
        res.status(200).send(followed);
    } catch (error) {
        console.log(error)
        res.send(error);
    }
})
// followe profile
router.post('/follow', verify, async (req, res) => {
    const requestedToken = req.header('auth-token');
    const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
    const user = await User.findOne({ _id: token._id });
    try {
        const userToFollow = await User.findOne({ _id: req.body.userId });
        console.log(userToFollow.followers)

        if (userToFollow.followers.includes(user._id)) {

            let newFollowers = userToFollow.followers.filter(function (follower) {
                return follower.toString() !== user._id.toString();
            });

            userToFollow.followers = await newFollowers;
            await userToFollow.save();

            console.log("follower rimosso")
            const response = {
                message: "user followed",
            }

            res.send(userToFollow);

            let newFollowed = userToFollow.followers.filter(function (follower) {
                return follower.toString() !== userToFollow._id.toString();
            });

            user.followed = await newFollowed;
            await user.save();
        }
        else {
            await userToFollow.followers.push(user._id);
            await userToFollow.save();

            user.followed.push(userToFollow._id);
            await user.save();

            res.send(userToFollow);
        }

    }
    catch (error) {
        console.log(error)
        res.send(error);
    }

});
module.exports = router;
