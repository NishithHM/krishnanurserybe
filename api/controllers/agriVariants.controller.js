const AgriVariants = require('../models/agriVariants.model')
const AgriOptions = require('../models/agriOptions.model')
const { isEmpty } = require('lodash')
const loggers = require('../../loggers')
exports.addAgriVariant = async (req, res)=>{
    const {type, name, options} = req.body
    checkAndAddType('type', type)
    const agriVariant = new AgriVariants({type, name, options})
    await agriVariant.save()
    options.map(({optionName, optionValues})=>{
        checkAndAddType(optionName, optionValues)
    })
    res.send({
        message:'Agri Variant added Succesfully'
    })
}

const checkAndAddType=async(optionName, optionVal)=>{
    try {
        const typeData = await AgriOptions.findOneAndUpdate({name: optionName}, {$set:  {name: optionName}, $push:{options:optionVal}}, {upsert: true})
        loggers.info("checkAndAddType-res", JSON.stringify(typeData))
    } catch (error) {
        loggers.info("checkAndAddType-error", JSON.stringify(error))
    }
}

exports.getAgriVariants=async(req, res)=>{
  try {
    const {search, pageNumber, isCount, type} = req.body
    const match = {}
    if(!isEmpty(type)){
        match.type = type.toLowerCase()
    }
    if(!isEmpty(search)){
        match['name']  = { $regex: search, $options: "i" }
    }

    const pipeline = []
    const count = {
        $count: 'count'
    }
    const projectField = ['type', 'name']
    const pagination = [{
        '$skip': 10 * (pageNumber - 1)
    }, {
        '$limit': 10
    }]
    pipeline.push({$match: match})
    if(isCount === true){
        pipeline.push(count)
    }else{
        if (projectField) {
            const project = {}
            projectField.forEach(f => project[f] = 1)
            pipeline.push({ $project: project })
        }
    }
    if (pageNumber) {
        pipeline.push(...pagination)
    }
    console.log("getAgriVariants-pipeline", JSON.stringify(pipeline))
    const orders = await AgriVariants.aggregate(pipeline)
    loggers.info(`getAgriVariants-pipeline, ${JSON.stringify(pipeline)}`)
    res.json(orders)
  } catch (error) {
    loggers.info("getAgriVariants-error", JSON.stringify(error))
  }
}