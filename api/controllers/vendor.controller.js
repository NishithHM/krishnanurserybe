const loggers = require('../../loggers')
const Vendor = require('../models/vendor.model')
const { handleMongoError } = require('../utils')

exports.getVendorList = async (req, res)=>{
    const {search, type, isDeviation} = req.body
    const query = {}

    if(search){
        query['name'] = {$regex:search, $options:"i"}
    }

    if(type){
        query.type = type;
    }

    if(isDeviation){
        query.deviation = {$gt:0}
    }

    try {
        const vendors = await Vendor.find(query, [], {sort:{updatedAt:-1}})
        const vendorFinal = vendors.map((ele)=> {
            const data = ele.toJSON()
            return{...data, paymentTypes: data.paymentTypes.sort((a, b)=> b.date-a.date) }
        })
        res.status(200).json(vendorFinal)
    } catch (error) {
        console.log(error)
        loggers.info(`getVendorList-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}

exports.getVendorById = async (req, res)=>{
    const {id} = req.body
    try {
        const vendor = await Vendor.findById(id)
        res.status(200).json(vendor)
    } catch (error) {
        console.log(error)
        loggers.info(`getVendorList-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}