const User = require('../models/user.model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

exports.register = async (req, res) => {
	const { name, phoneNumber, email, role, password } = req.body;
	const hash_password = bcrypt.hashSync(password, 10)
	const isActive = true;
    const createdBy = {
        _id: req?.token?.id,
        name:req?.token?.name
    }
	const user = new User({ name, phoneNumber,email, role, hash_password, isActive, createdBy, modifiedBy: createdBy });
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
              { id: user._id, name: user.name, role: user.role },
              jwtSecret,
              {
                expiresIn: maxAge, 
              }
            );
            res.cookie("jwt", token, {
              httpOnly: true,
              maxAge: maxAge * 1000, 
            });
            res.status(200).json({user})
        }else{
            res.status(400).json({
                message: "Login not successful",
                error: "Password mismatch",
              })
        }
		
	} catch (error) {
		res.status(500).send(error)
	}
};

exports.getAllUsers =async(req, res)=>{
    try {
        const users = await User.find({isActive:true})
        res.json({users})    
    } catch (error) {
        res.status(500).send(error)
    }
   
}

exports.deleteUserById =async(req, res)=>{
    const { id } = req.body;
    const _id = new mongoose.mongo.ObjectId(id);
    try {
       const response =  await User.findByIdAndUpdate(_id, {$set:{isActive:false}}, {runValidators:true})
       res.status(200).json({
        message:'successfully deleted'
       })
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
   
}