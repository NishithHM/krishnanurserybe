const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const userSchema = new mongoose.Schema({
	name:{
		type:String,
		required:[true, 'Name is required'],
		lowercase:true,
	},
	phoneNumber: {
		type:Number,
		required: true,
		validate:{
			validator: (val)=> val.toString().length === 10,
			message:(props)=> {
				return `${props.value} is not 10 digit long`
			}
		},
	},
	email:{
		type:String,
		trim: true,
		lowercase: true,
		immutable: true,
		maxlength:30,
	},
	role:{
		type: String,
		required: true,
		trim: true,
	},
	isActive:{
		type: Boolean,
		required: true,
		default:true
	},
	hash_password:{
		type: String,
		required: true,
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
    }
}, {
	timestamps: true
})

userSchema.methods.comparePassword = function(password){
	return bcrypt.compareSync(password,this.hash_password)
}

userSchema.methods.toJSON=function(){
	const user = this
	const userObj = user.toObject()
	delete userObj.hash_password
	return userObj;
}

userSchema.index({'phoneNumber': 1, 'email':1}, {unique: true})

module.exports = mongoose.model("user", userSchema)