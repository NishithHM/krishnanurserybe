const User = require('../models/user.model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const name = "nishith" + Math.random()
    const phoneNumber = Math.random()
	//console.log(req.body)
	// var { name, phoneNumber, email, role, password } = req.body;

	// if (password == undefined || role == undefined) {
	// 	password = phoneNumber.toString();
	// 	role = "user";
	// }
	// const hash_password = bcrypt.hashSync(password, 10)
	// const isActive = true;
	const user = new User({ name, phoneNumber });

	try {
		await user.save()
		res.status(201).json({
			 user
		})
	} catch (error) {
		console.log(error)
		res.status(400).send(error)
	}
};


exports.singIn = async (req, res) => {
	try {
		const response = await User.find({})
        res.status(200).send(response)
		
	} catch (error) {
		console.log(error)
	}
};