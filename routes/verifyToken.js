const jwt = require('jsonwebtoken');
const User = require('../models/User');

// IF YOU WANT TO PROTECT A ROUTE AND CHECK IF TOKEN IS VALID JUST ADD THIS FUNCTION AFTER THE ROUTE PATH
const invalidToken = {
    error: 'invalid token'
}
const acessDenied = {
    error: 'Access denied'
}

module.exports = function (req, res, next) {
    const token = req.header('auth-token');
    console.log(token)
    if (!token) return res.status(401).send(acessDenied);
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        User.findOne({ _id: verified._id }, function (err, doc) {
            if (doc) {
                req.userId = verified._id;
                next();
            }
            else {
                return false
            }
        });
    } catch (err) {
        res.status(400).send(invalidToken);
    }
}