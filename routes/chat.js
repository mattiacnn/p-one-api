const router = require('express').Router();
const Challenge = require("../models/Challenge");
const Participant = require("../models/Participant");
const User = require("../models/User");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const jwt = require('jsonwebtoken');
const moment = require('moment')
const { Expo } = require('expo-server-sdk')

const verify = require('./verifyToken');

String.prototype.toObjectId = function () {
    var ObjectId = (require('mongoose').Types.ObjectId);
    return new ObjectId(this.toString());
};

router.post("/open-chat", verify, async (req, res) => {
    try {
        const requestedToken = req.header('auth-token');
        const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
        const user = await User.findOne({ _id: token._id });

        const chat = await Chat.findOne({ users: { "$all": req.body.users } });
        if (!chat) {
            const newChat = await new Chat({
                users: req.body.users,
            });

            await newChat.save();
            res.status(200).send(newChat);
        }
        else {
            res.status(200).send(chat);
        }

    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});

router.post("/all-chats", verify, async (req, res) => {
    try {
        const requestedToken = req.header('auth-token');
        const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
        const user = await User.findOne({ _id: token._id });

        const chats = await Chat.find({ users: { "$in": user._id.toString() } });

        const _idToQuery = [];

        for (let i = 0; i < chats.length; i++) {
            const result = await chats[i].users.filter(el => el !== user._id.toString());
            _idToQuery.push(result[0].toObjectId());
        }

        const profiles = await User.find({ _id: { "$in": _idToQuery } });

        res.status(200).send({ chats: chats, profiles: profiles });
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});

router.post("/all-messages", verify, async (req, res) => {
    try {
        const requestedToken = req.header('auth-token');
        const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
        const user = await User.findOne({ _id: token._id });

        const messages = await Message.find({ chat: req.body.chat });
        res.status(200).send(messages);
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});

router.post("/send-post", verify, async (req, res) => {
    try {
        const requestedToken = req.header('auth-token');
        const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
        const user = await User.findOne({ _id: token._id });

        const recipients = req.body.recipients;

        recipients.forEach(async (element) => {

            const chat = await Chat.findOne({ users: { "$all": [user._id.toString(), element.toString()] } });

            if (!chat) {

                const newChat = await new Chat({
                    users: [user._id.toString(), element.toString()],
                });

                newChat.save();

                const newMessage = await new Message({
                    author: user._id,
                    to: element,
                    text: "",
                    chat: newChat._id,
                    post: req.body.post
                });

                await newMessage.save();
                console.log(newMessage)
            }
            else {
                const newMessage = await new Message({
                    author: user._id,
                    to: element,
                    text: "",
                    chat: chat._id,
                    post: req.body.post
                });

                await newMessage.save();
                console.log(newMessage)

            }
        });


        res.status(200).send({ message: "sent" });
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
})

router.post("/new-message", verify, async (req, res) => {
    try {
        const requestedToken = req.header('auth-token');
        const token = jwt.verify(requestedToken, process.env.TOKEN_SECRET);
        const user = await User.findOne({ _id: token._id });

        const newMessage = await new Message({
            author: user._id,
            to: req.body.to,
            text: req.body.text,
            chat: req.body.chat,
            post: req.body.post,
        });

        await newMessage.save();
        res.status(200).send(newMessage);

        const chat = await Chat.findOne({ _id: req.body.chat.toObjectId() });
        chat.latestMessage = req.body.text;
        await chat.save();

        const receiver = await User.findOne({ _id: req.body.to.toObjectId() });

        try {
            let expo = new Expo();

            let messages = [];
            messages.push({
                to: receiver.notificationToken,
                sound: 'default',
                title: 'Hai ricevuto un nuovo messaggio da ' + user.username,
                body: req.body.text
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
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err);
    }
});
module.exports = router;