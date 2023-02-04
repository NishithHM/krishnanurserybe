const jwt = require("jsonwebtoken")
const Joi = require("joi")
const isEmpty = require('lodash/isEmpty')
const User = require('../models/user.model')
exports.authWall = (roles)=>(req, res, next) => {
    const token = req.cookies.jwt
    const jwtSecret = process.env.JWT;
    if (token) {
        jwt.verify(token, jwtSecret, async (err, decodedToken) => {
            if (err) {
                console.log({ err })
                return res.status(401).json({ message: "Not authorized" })
            } else {
                if (!roles.includes(decodedToken.role)) {
                    return res.status(401).json({ message: "Not authorized" })
                } else if (decodedToken.id) {
                    const users = await User.findOne({ _id: decodedToken.id, isActive: true })
                    if (isEmpty(users)) {
                        res.status(401).json({ message: "Not authorized" })
                    } else {
                        req.token = { ...decodedToken }
                        next()
                    }
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
    if (!isEmpty(error)) {
        const { details } = error;
        const message = details.map(i => i.message).join(',');
        console.log("error", message);
        res.status(422).json({ error: message })
    } else {
        next()
    }

}

exports.paramsToBody =(listOfParams, type)=> (req, res, next) =>{
    //type params / query
    const params = {}
    for(let i=0; i<listOfParams.length; i++){
        params[listOfParams[i]] = req[type][listOfParams[i]]
    }
    req.body = {...req.body, ...params}
    next()
}