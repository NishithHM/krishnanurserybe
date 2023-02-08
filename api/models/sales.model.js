const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const salesSchema = new mongoose.Schema({
		customer_id: {
			type: mongoose.Schema.Types.ObjectId,
			required:true,
		},
		customerName: {
			type: String,
			required: [true, 'Name is required'],
			lowercase: true,
		},
		customerNumber: {
			type: Number,
			required: true,
			validate: {
				validator: (val) => val.toString().length === 10,
				message: (props) => {
					return `${props.value} is not 10 digit long`
				}}
	},
	items: {
		type: [{
			procurement_id: {
				type: mongoose.Schema.Types.ObjectId,
				required: true
			},
			procurementName: {
				type: String,
				required: true
			},
			variantsName: {
				variant_id: {
					type: mongoose.Schema.Types.ObjectId,
					required: true
				},
				en: {
					name: {
						type: String,
						required:true,
					}
				},
				ka: {
					name: {
						type: String,
					}
				}
			},
			quantity: {
				type: Number,
				required: true,
			},
			mrp: {
				type: Number, 	// saving this bcz, admin might increase/decrease price later
				required: true,
			},
			rate: {
				type: Number,
				required: true,
			},
			isActive:{
				type:Boolean,
				default:true
			}
		}],
		totalPrice: {
			type: Number,
			required: true,
		},
		discount: {
			type: Number,
			default:0
		},
		roundOff: {
			type: Number,
			default:0
		},
		SoldBy: {
			name: {
				type: String,
				lowercase: true,
			},
			_id: {
				type: mongoose.Schema.Types.ObjectId,
				required:true
			}
		},
		billedBy: {
			name: {
				type: String,
				lowercase: true,
			},
			_id: {
				type: mongoose.Schema.Types.ObjectId,
				required:true
			}
		},
		status:{
			type:String,
			required:true
		}
	}
}, {
	timestamps: true
})

module.exports = mongoose.model("sales", salesSchema)