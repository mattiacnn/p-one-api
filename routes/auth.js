const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// validation
const { registerValidation, loginValidation } = require('../validation');

// register a user
router.post('/register', async (req, res) => {
    console.log("called register..")
    // validate the data
    const { error } = registerValidation(req.body)
    // if data are not valid send the error 
    if (error) return res.status(400).send(error.details[0]);
    // check if user already exist
    const emailExist = await User.findOne({ email: req.body.email });

    // sending the error as an object so the frontend can easily parse it into json
    const formattedError = {
        error: 'email exixst'
    }
    if (emailExist) return res.status(400).send(formattedError);

    // check if user already exist
    const usernameExist = await User.findOne({ username: req.body.username });

    // sending the error as an object so the frontend can easily parse it into json
    const formattedUsernameError = {
        error: 'username exixst'
    }
    if (usernameExist) return res.status(400).send(formattedUsernameError);

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // create new user object
    const user = new User({
        email: req.body.email,
        username: req.body.username,
        password: hashedPassword,
    });

    // try to save the object on db
    try {
        const savedUser = await user.save();
        res.status(200).send(savedUser);
    } catch (err) {
        res.status(400).send(err);
    }
});

// login with facebook
router.post('/login/facebook', async (req, res) => {
    console.log("called facebook login...");

    const user = await User.findOne({ email: req.body.email });
    let newUser;

    if (!user) {
        console.log("creating new user...")
        // create new user object
        newUser = await new User({
            email: req.body.email,
            username: req.body.username,
            password: req.body.tokenFb,
            authtType: "facebook"
        });

        // try to save the object on db
        await newUser.save();
    }

    if (user && user.authtType === "facebook" || newUser.authtType === "facebook") {
        // create and assign token
        const token = jwt.sign({ _id: user ? user._id : newUser._id }, process.env.TOKEN_SECRET);
        const response = {
            "token": token,
            "user": user ? user : newUser
        }
        res.header('auth-token', token).send(response);
    }
    else {
        const response = {
            "message": "La tua email è già stata utilizzata per un login standard, non puoi utilizzare accedi con facebook",
        }
        res.send(response);
    }

});

// login a user
router.post('/login', async (req, res) => {
    console.log("called login..")

    // check if user already exist
    const user = await User.findOne({ email: req.body.email });
    // sending the error as an object so the frontend can easily parse it into json
    const formattedError = {
        "error": 'the email does not exist'
    }
    if (!user) return res.status(400).send(formattedError);

    // check if password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    // sending the error as an object so the frontend can easily parse it into json
    const formattedPswError = {
        "error": 'wrong_credentials'
    }
    if (!validPassword) return res.status(400).send(formattedPswError);

    // create and assign token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    const response = {
        "token": token,
        "user": user
    }
    res.header('auth-token', token).send(response);

})

module.exports = router;