const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const brokers = new mongoose.Schema({
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

brokers.index({'contact': 1}, {unique: true})

brokers.on('index', function(err) {
    if (err) {
        console.error('brokers index error: %s', err);
    } else {
        console.info('brokers indexing complete');
    }
});
module.exports = mongoose.model("brokers", brokers)