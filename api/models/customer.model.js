const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const customerSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Name is required'],
		lowercase: true,
	},
	phoneNumber: {
		type: Number,
		required: true,
		validate: {
			validator: (val) => val.toString().length === 10,
			message: (props) => {
				return `${props.value} is not 10 digit long`
			}
		},
		unique: true
	},
	dob: {
		type: Date,
		required: true
	},
	interestedCategories: {
		type: [{
			_id: {
				type: String,
				required: true
			},
			names: {
				en:{
                    name:{
                        type: String,
                    }
                },
                ka:{
                    name:{
                        type: String,
                    }
                }
			}
		}]
	}
}, {
	timestamps: true
})

module.exports = mongoose.model("customer", customerSchema)