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

categories.on('index', function(err) {
    if (err) {
        console.error('categories index error: %s', err);
    } else {
        console.info('categories indexing complete');
    }
});

module.exports = mongoose.model("categories", categories)