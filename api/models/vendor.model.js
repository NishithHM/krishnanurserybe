const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const vendors = new mongoose.Schema({
	name: {
        type: String,
        required: true,
    },
   contact:{
        type: String,
        required: true,
        unique: true,
   },
}, {
	timestamps: true
})

vendors.index({'contact': 1}, {unique: true})


module.exports = mongoose.model("vendors", vendors)