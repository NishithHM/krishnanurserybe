const jwt = require("jsonwebtoken")
const Joi = require("joi")
const isEmpty = require('lodash/isEmpty')
exports.adminAuth = (req, res, next) => {
    const token = req.cookies.jwt
    const jwtSecret = process.env.JWT;
    if (token) {
        jwt.verify(token, jwtSecret, (err, decodedToken) => {
            if (err) {
                console.log({ err })
                return res.status(401).json({ message: "Not authorized" })
            } else {
                if (decodedToken.role !== "admin") {
                    return res.status(401).json({ message: "Not authorized" })
                } else {
                    req = { ...req, ...decodedToken }
                    next()
                }
            }
        })
    } else {
        return res
            .status(401)
            .json({ message: "Not authorized, token not available" })
    }
}

exports.bodyValidator = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if(!isEmpty(error)){
        const { details } = error;
        const message = details.map(i => i.message).join(',');
        console.log("error", message);
        res.status(422).json({ error: message })
    }else{
        next()
    }
    
}