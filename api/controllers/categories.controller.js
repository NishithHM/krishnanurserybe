const Category = require('../models/categories.model')
const mongoose = require('mongoose');
const { handleMongoError } = require('../utils');
const loggers = require('../../loggers');

exports.createCategory = async (req, res) => {
	const { nameInEnglish, nameInKannada } = req.body;
	const categoryObj = {
        names:{
            en:{
                name: nameInEnglish
            },
            ka:{
                name: nameInKannada
            }
        }
    }
    const isActive = true
    const createdBy = {
        _id: req?.token?.id,
        name:req?.token?.name
    }
	const category = new Category({ ...categoryObj, isActive, createdBy, modifiedBy: createdBy });
	try {
		await category.save()
		res.status(201).json({
			 category
		})
	} catch (error) {
		console.log(error)
        loggers.info(`createCategory-error, ${error}`)
		const err = handleMongoError(error)
        res.status(400).send(err)
	}
};



exports.getAllCategories =async(req, res)=>{
    const {pageNumber, search, isCount, sortBy, sortType} = req.body;
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
                'names.en.name': {$regex:search, $options:"i"}
              }
            },
        ]  
        const count = [
            {
              '$count': 'count'
            },
        ]
        const sortVal ={
            "categoryName" : "names.en.name"
        }
        const sortStage = [{
            '$sort':{
                [sortVal[sortBy]] : parseInt(sortType)
            }
        }]

        const pipeline = []
        pipeline.push(...match)
        if(search){
            pipeline.push(...searchMatch)
        }
        if(sortBy && sortType) {
            pipeline.push(...sortStage)
        }
        if(pageNumber){
            pipeline.push(...pagination)
        }
        if(isCount){
            pipeline.push(...count)
        }else{
            const mandatory = ['_id', 'names', 'createdAt']
            const project = {}
            mandatory.forEach(f=> project[f] = 1)
            pipeline.push({$project: project})
        }
        
        console.log("getAllCategories-pipeline",JSON.stringify(pipeline))
        loggers.info(`getAllCategories-pipeline, ${JSON.stringify(pipeline)}`)
        const categories = await Category.aggregate(pipeline)
        res.json(categories)    
    } catch (error) {
        console.log(error)
        loggers.info(`getAllCategories-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
   
}

exports.deleteCategoryById =async(req, res)=>{
    const { id } = req.body;
    const _id = new mongoose.mongo.ObjectId(id);
    try {
       const response =  await Category.findByIdAndUpdate(_id, {$set:{isActive:false}}, {runValidators:true})
       res.status(200).json({
        message:'successfully deleted'
       })
    } catch (error) {
        console.log(error)
        loggers.info(`deleteCategoryById-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
   
}