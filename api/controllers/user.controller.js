const User = require('../models/user.model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { handleMongoError } = require('../utils');
const loggers = require('../../loggers');

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
        loggers.info(`register-error, ${error}`)
        const err = handleMongoError(error)
        res.status(400).send(err)
	}
};


exports.singIn = async (req, res) => {
	try {
		const {phoneNumber, password}  = req.body
        const user = await User.findOne({phoneNumber, isActive: true})
        loggers.info(`user-info, ${user}`)
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
            if(process.env.ENV === "dev" || process.env.ENV === "qa" ){
                res.status(200).json({user, token})
            }else if(process.env.ENV === "prod" ){
                res.status(200).json({user})
            }
            
        }else{
            res.status(400).json({
                message: "Login not successful",
                error: "Password mismatch",
              })
        }
		
	} catch (error) {
        loggers.info(`singIn-error, ${error}`)
        const err = handleMongoError(error)
		res.status(500).send(err)
	}
};

exports.getAllUsers =async(req, res)=>{
    const {pageNumber, search, isCount} = req.body;
    try {
        const match = [
            {
              '$match': {
                'isActive': true
              }
            },
          ]
        const pagination = [ {
            '$skip': 10 * (pageNumber -1)
          }, {
            '$limit': 10
          }] 
        const searchMatch = [
            {
              '$match': {
                'name': {$regex:search, $options:"is"}
              }
            },
        ]  
        const count = [
            {
              '$count': 'count'
            },
        ]  

        const pipeline = []
        pipeline.push(...match)
        if(search){
            pipeline.push(...searchMatch)
        }
        if(pageNumber){
            pipeline.push(...pagination)
        }
        if(isCount){
            pipeline.push(...count)
        }else{
            const mandatory = ['_id', 'name', 'createdAt', 'updatedAt', 'role', 'phoneNumber']
            const project = {}
            mandatory.forEach(f=> project[f] = 1)
            pipeline.push({$project: project})
        }
        
        console.log("getAllUsers-pipeline",JSON.stringify(pipeline))
        loggers.info(`getAllUsers-pipeline, ${pipeline}`)
        const users = await User.aggregate(pipeline)
        res.json({users})    
    } catch (error) {
        console.log(error)
        loggers.info(`getAllUsers-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
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
        loggers.info(`deleteUserById-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
   
}