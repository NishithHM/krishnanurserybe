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
   deviation: {
    type: Number,
    default: 0
   }
}, {
	timestamps: true
})

vendors.index({'contact': 1}, {unique: true})

vendors.on('index', function(err) {
    if (err) {
        console.error('vendors index error: %s', err);
    } else {
        console.info('vendors indexing complete');
    }
});
module.exports = mongoose.model("vendors", vendors)