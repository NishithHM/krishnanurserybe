const loggers = require('../../loggers')
const Broker = require('../models/broker.model')
const { handleMongoError } = require('../utils')

exports.getBrokerList = async (req, res)=>{
    const {search} = req.body
    const query = {
        'name': {$regex:search, $options:"i"}
     }
    try {
        const brokers = await Broker.find(query)
        res.status(200).json(brokers)
    } catch (error) {
        console.log(error)
        loggers.info(`getBrokerList-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}