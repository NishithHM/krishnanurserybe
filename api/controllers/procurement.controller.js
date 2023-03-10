const Procurement = require('../models/procurment.model')
const Vendor = require('../models/vendor.model')
const ProcurementHistory = require('../models/procurementHistory.model')
const mongoose = require('mongoose')
const dayjs = require('dayjs')
const uniq = require('lodash/uniq')
const { handleMongoError, uploadFile } = require('../utils')
const loggers = require('../../loggers')
exports.addNewProcurement = async (req, res) => {
    const { nameInEnglish, nameInKannada, vendorName, vendorContact, totalQuantity, totalPrice, description, vendorId, categories } = req.body
    const names = {
        en: {
            name: nameInEnglish
        },
        ka: {
            name: nameInKannada
        }
    }
    let newVendorId
    if (!vendorId) {
        const vendorData = await new Vendor({ contact: vendorContact, name: vendorName })
        newVendorId = vendorData._id
        vendorData.save()
    }
    const createdBy = {
        _id: req?.token?.id,
        name: req?.token?.name
    }
    let awsPath = ''
    if(req.file){
       awsPath = `nursery/procurements/${req.file.filePath}`
    }
    const procurementHistoryData = [{
        createdBy,
        quantity: totalQuantity,
        totalPrice,
        procuredOn: new Date(),
        description,
        vendorName,
        vendorContact,
        vendorId: vendorId || newVendorId,
        invoice: awsPath 
    }]
    const procurementHistoryDataObj = { ...procurementHistoryData[0], names}

    const procurement = new Procurement({ names, totalQuantity, remainingQuantity: totalQuantity, lastProcuredOn: new Date(), procurementHistory: procurementHistoryData, categories })
    try {
        const response = await procurement.save()
        const procurementHistory = new ProcurementHistory({ ...procurementHistoryDataObj, procurementId: response._id , invoice: awsPath})
        procurementHistory.save()
        if(req.file){
            uploadFile({file: req.file, path:'nursery/procurements'})
        }
        res.status(201).json({
            response
        })

    } catch (error) {
        console.log(error)
        loggers.info(`addNewProcurement-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.updateProcurement = async (req, res) => {
    const { vendorName, vendorContact, totalQuantity, totalPrice, description, id, vendorId, categories } = req.body
    try {
        const procurement = await Procurement.findById(id)
        if (procurement) {
            const names = procurement.names
            const createdBy = {
                _id: req?.token?.id,
                name: req?.token?.name
            }
            let newVendorId
            if (!vendorId) {
                const vendorData =  new Vendor({ contact: vendorContact, name: vendorName })
                newVendorId = vendorData._id
                await vendorData.save()
            }
            procurement.totalQuantity += totalQuantity
            procurement.remainingQuantity += totalQuantity
            procurement.lastProcuredOn = new Date()
            procurement.categories = [...categories];
            let awsPath = ''
            if(req.file){
                awsPath = `nursery/procurements/${req.file.filename}`
             }
            const procurementHistoryData = [{
                createdBy,
                quantity: totalQuantity,
                totalPrice,
                procuredOn: new Date(),
                description,
                vendorName,
                vendorContact,
                vendorId: vendorId || newVendorId,
                invoice: awsPath 
            }]

            const procurementHistoryDataObj = { ...procurementHistoryData[0], names, procurementId: procurement._id }
            if (procurement.procurementHistory.length >= 10) {
                const newHistory =  [...procurement.procurementHistory]
                newHistory.shift()
                newHistory.unshift(procurementHistoryDataObj)
                procurement.procurementHistory = newHistory;
            } else {
                procurement.procurementHistory.unshift(procurementHistoryDataObj)
            }
            console.log('shot',procurement.procurementHistory)
            const procurementHistory = new ProcurementHistory({ ...procurementHistoryDataObj })
            const response = await procurement.save()
            procurementHistory.save()
            if(req.file){
                 uploadFile({file: req.file, path:'nursery/procurements'})
           }
            res.status(201).json({
                response
            })
        } else {
            res.status(400).send("Record not found")
        }
    } catch (error) {
        // console.log(error)
        loggers.info(`updateProcurement-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.getAllProcurements = async (req, res) => {
    const { pageNumber, search, isCount, sortBy, sortType } = req.body;
    try {
        const match = [
            {
                '$match': {
                }
            },
        ]
        const pagination = [{
            '$skip': 10 * (pageNumber - 1)
        }, {
            '$limit': 10
        }]
        const searchMatch = [
            {
                '$match': {
                    'names.en.name': { $regex: search, $options: "i" }
                }
            },
        ]
        const count = [
            {
                '$count': 'count'
            },
        ]
        const sortVal = {
            "plantName": "names.en.name",
            "lastProcuredOn": "lastProcuredOn"
        }
        const sortStage = [{
            '$sort': {
                [sortVal[sortBy]]: parseInt(sortType)
            }
        }]

        const pipeline = []
        pipeline.push(...match)
        if(req?.token?.role==="sales"){
            const salesMatch = [
                {
                    '$match': {
                        "variants.0": {$exists: true}
                    }
                },
            ]
            pipeline.push(...salesMatch)
        }
        if (search) {
            pipeline.push(...searchMatch)
        }
        if (sortBy && sortType) {
            pipeline.push(...sortStage)
        }
        if (pageNumber) {
            pipeline.push(...pagination)
        }
        if (isCount) {
            pipeline.push(...count)
        }

        console.log("getAllProcurements-pipeline", JSON.stringify(pipeline))
        loggers.info(`getAllProcurements-pipeline, ${JSON.stringify(pipeline)}`)
        const procurements = await Procurement.aggregate(pipeline)
        if(count){
            res.json(procurements)
        }else{
            const procurementsWithAvg = procurements.map(procurement=>{
            const sum = procurement?.procurementHistory?.reduce((acc, ele)=> {
                    return acc + (ele.totalPrice / ele.quantity )
            }, 0)
            const averagePrice =  (sum  / procurement.procurementHistory.length).toFixed(2)
            return {...procurement, averagePrice}
            })
            res.json(procurementsWithAvg)
        }
        
    } catch (error) {
        console.log(error)
        loggers.info(`getAllProcurements-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.getAllProcurementsHistory = async (req, res) => {
    const { pageNumber, isCount, id, startDate, endDate, isAverage } = req.body;
    const procurementId = new mongoose.mongo.ObjectId(id);
    try {
        const match = [
            {
                '$match': {
                    procurementId,
                    createdAt: {
                        $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
                        $lt: dayjs(endDate, 'YYYY-MM-DD').add(1, 'day').toDate()
                    }
                }
            },
        ]
        const pagination = [{
            '$skip': 10 * (pageNumber - 1)
        }, {
            '$limit': 10
        }]

        const count = [
            {
                '$count': 'count'
            },
        ]

        const sortStage = [{
            '$sort': {
                createdAt: -1
            }
        }]

        const pipeline = []
        pipeline.push(...match)
        pipeline.push(...sortStage)

        if (pageNumber) {
            pipeline.push(...pagination)
        }

        if (isCount) {
            pipeline.push(...count)
        }

        if(isAverage){
            const averagePriceStage = {
                $group:{
                    _id: "null",
                    avg: {
                      "$avg": {$divide:["$totalPrice","$quantity"]}
                    }
                  }
            }
            pipeline.push(averagePriceStage)
        }

        console.log("getAllProcurementsHistory-pipeline", JSON.stringify(pipeline))
        const procurements = await ProcurementHistory.aggregate(pipeline)
        loggers.info(`getAllProcurementsHistory-pipeline, ${JSON.stringify(pipeline)}`)
        res.json(procurements)
    } catch (error) {
        console.log(error)
        loggers.info(`getAllProcurementsHistory-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.addProcurementVariants = async (req, res) => {
    const { id, variants } = req.body
    try {
        const procurement = await Procurement.findById(id)
        if (procurement) {
            const variantsDb = variants.map(val => ({
                names: {
                    en: {
                        name: val.variantNameInEnglish
                    },
                    ka: {
                        name: val.variantNameInKannada
                    }
                },
                minPrice: val.minPrice,
                maxPrice: val.maxPrice
            }));
            procurement.variants = [...variantsDb]
            const names = procurement.variants.map(val => (
                val.names.en
            ));
            const uniqVal = uniq(names)
            if (names.length === uniqVal.length) {
                const response = await procurement.save()
                res.json(response)
            } else {
                res.status(400).json({ error: 'duplicate variant name' })
            }


        } else {
            res.status(400).send("Record not found")
        }
    } catch (error) {
        console.log(error)
        loggers.info(`addProcurementVariants-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.setMinimumQuantity = async (req, res) => {
    const { id, minimumQuantity } = req.body
    try {
        const procurement = await Procurement.findById(id)
        if (procurement) {
            procurement.minimumQuantity = minimumQuantity;
            const response = await procurement.save()
            res.json(response)
        } else {
            res.status(400).send("Record not found")
        }
    } catch (error) {
        console.log(error)
        loggers.info(`setMinimumQuantity-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.getLowProcurements = async (req, res) => {
    const { pageNumber, isCount, sortBy, sortType } = req.body;
    try {
        const match = [
            {
                '$match': {
                    $expr:{
                      $lt:["$remainingQuantity", "$minimumQuantity"]
                    }
                  }
            },
        ]
        const pagination = [{
            '$skip': 10 * (pageNumber - 1)
        }, {
            '$limit': 10
        }]
        
        const count = [
            {
                '$count': 'count'
            },
        ]
        const sortVal = {
            "minimumQuantity": "minimumQuantity"
        }
        const sortStage = [{
            '$sort': {
                [sortVal[sortBy]]: parseInt(sortType)
            }
        }]

        const pipeline = []
        pipeline.push(...match)
        if (sortBy && sortType) {
            pipeline.push(...sortStage)
        }
        if (pageNumber) {
            pipeline.push(...pagination)
        }
        if (isCount) {
            pipeline.push(...count)
        }

        console.log("getLowProcurements-pipeline", JSON.stringify(pipeline))
        loggers.info(`getLowProcurements-pipeline, ${JSON.stringify(pipeline)}`)
        const procurements = await Procurement.aggregate(pipeline)
        res.json(procurements)
    } catch (error) {
        console.log(error)
        loggers.info(`getLowProcurements-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}