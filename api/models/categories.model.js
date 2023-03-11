const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const categories = new mongoose.Schema({
	names:{
		en:{
            name:{
                type: String,
                required: true,
            }
        },
        ka:{
            name:{
                type: String,
                required: true
            }
        }
	},
    createdBy:{
        name:{
            type:String,
		    lowercase:true,
        },
        _id:{
            type: mongoose.Schema.Types.ObjectId,
        }
    },
    modifiedBy:{
        name:{
            type:String,
		    lowercase:true,
        },
        _id:{
            type: mongoose.Schema.Types.ObjectId,
        }
    },
    isActive:{
		type: Boolean,
		required: true,
		default:true
	},
}, {
	timestamps: true
})

categories.index({'names.en.name': 1, 'isActive': 1}, {unique: true})



module.exports = mongoose.model("categories", categories)