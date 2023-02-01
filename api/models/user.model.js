const mongoose = require('mongoose')
const validator = require('validator')
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
		// validate:{
		// 	validator: (val)=> val.toString().length === 10,
		// 	message:(props)=> {
		// 		return `${props.value} is not 10 digit long`
		// 	}
		// },
		unique: true
	},
	// email:{
	// 	type:String,
	// 	trim: true,
	// 	lowercase: true,
	// 	immutable: true,
	// 	unique: true,
	// 	maxlength:30,
	// },
	// role:{
	// 	type: String,
	// 	required: true,
	// 	trim: true,
		
	// },
	// isActive:{
	// 	type: Boolean,
	// 	required: true,
	// 	default:true
	// },
	// hash_password:{
	// 	type: String,
	// 	required: true,
	// },
}, {
	timestamps: true
})

// userSchema.methods.comparePassword = function(password){
// 	return bcrypt.compareSync(password,this.hash_password)
// }

// userSchema.methods.toJSON=function(){
// 	const user = this
// 	const userObj = user.toObject()
// 	delete userObj.hash_password
// 	return userObj;
// }

module.exports = mongoose.model("user", userSchema)