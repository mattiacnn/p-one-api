// validation
const Joi = require('joi');

// user validation
const registerValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string().min(3).required(true),
        email: Joi.string().min(6).required(true).email(),
        password: Joi.string().min(6).required(true)
    });
    return schema.validate(data);
}

const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).required(true).email(),
        password: Joi.string().min(6).required(true)
    });
    return schema.validate(data);
}

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;