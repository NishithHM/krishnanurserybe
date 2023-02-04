const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const vendors = new mongoose.Schema({
	name: {
        type: String,
        required: true,
        unique: true,
    },
   contact:{
        type: String,
        required: true,
        unique: true,
   },
}, {
	timestamps: true
})



module.exports = mongoose.model("vendors", vendors)