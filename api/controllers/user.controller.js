const User = require('../models/user.model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
exports.register = async (req, res) => {
	const { name, phoneNumber, email, role, password } = req.body;
	const hash_password = bcrypt.hashSync(password, 10)
	const isActive = true;
	const user = new User({ name, phoneNumber,email, role, hash_password, isActive });
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
		const {phoneNumber, password}  = req.body
        const user = await User.findOne({phoneNumber})
        if (!user) {
            res.status(400).json({
              message: "Login not successful",
              error: "User not found",
            })
        }else if(user.comparePassword(password)){
            const maxAge = 24 * 60 * 60;
            const jwtSecret = process.env.JWT;
            const token = jwt.sign(
              { id: user._id, role: user.role },
              jwtSecret,
              {
                expiresIn: maxAge, // 3hrs in sec
              }
            );
            res.cookie("jwt", token, {
              httpOnly: true,
              maxAge: maxAge * 1000, // 3hrs in ms
            });
            res.status(200).json({user})
        }else{
            res.status(400).json({
                message: "Login not successful",
                error: "Password mismatch",
              })
        }
		
	} catch (error) {
		console.log(error)
	}
};

exports.getAllUsers =async(req, res)=>{
    const users = await User.find({})
    res.json({users})
}