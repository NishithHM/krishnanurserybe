const loggers = require('../../loggers')
const Vendor = require('../models/vendor.model')
const { handleMongoError } = require('../utils')

exports.getVendorList = async (req, res)=>{
    const {search, type} = req.body
    const query = {
        'name': {$regex:search, $options:"i"},
        type
     }
    try {
        const vendors = await Vendor.find(query)
        res.status(200).json(vendors)
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