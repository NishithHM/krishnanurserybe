const Procurement = require('../models/procurment.model')
const Vendor = require('../models/vendor.model')
const ProcurementHistory = require('../models/procurementHistory.model')
const mongoose = require('mongoose')
const uuid = require('uuid')
const dayjs = require('dayjs')
const uniq = require('lodash/uniq')
const { handleMongoError, uploadFile } = require('../utils')
const loggers = require('../../loggers')
const { isEmpty } = require('lodash')

exports.requestOrder = async (req, res) => {
    const { nameInEnglish, totalQuantity, id, descriptionSales } = req.body
    const names = {
        en: {
            name: nameInEnglish
        },
        ka: {
            name: ''
        }
    }

    const requestedBy = {
        _id: req?.token?.id,
        name: req?.token?.name
    }
    let procurement;
    let procurementHis;
    if (id) {
        procurement = await Procurement.findById(id)
    } else {
        procurement = new Procurement({ names, totalQuantity: 0, remainingQuantity: 0 })
    }
    try {
        if (id) {
            procurementHis = new ProcurementHistory({ procurementId: procurement._id, names: procurement.names, requestedQuantity: totalQuantity, requestedBy, status: 'REQUESTED', descriptionSales })
        } else {
            const res = await procurement.save()
            procurementHis = new ProcurementHistory({ procurementId: res._id, names, requestedQuantity: totalQuantity, requestedBy, descriptionSales })
        }
        await procurementHis.save()
        res.status(201).json({
            message: 'Successfully Requested'
        })
    } catch (error) {
        console.log(error)
        loggers.info(`addNewProcurement-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}

exports.placeOrder = async (req, res) => {
    const { nameInEnglish, totalQuantity, nameInKannada, vendorContact, vendorName, vendorId, description, categories, id, procurementId, totalPrice, currentPaidAmount, expectedDeliveryDate } = req.body
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
        const vendorData = new Vendor({ contact: vendorContact, name: vendorName })
        newVendorId = vendorData._id
        vendorData.save()
    }
    const placedBy = {
        _id: req?.token?.id,
        name: req?.token?.name
    }
    const newData = {
        names,
        orderedQuantity: totalQuantity,
        descriptionProc: description,
        placedBy,
        vendorName,
        vendorContact,
        vendorId: vendorId || newVendorId,
        status: 'PLACED',
        expectedDeliveryDate: dayjs(expectedDeliveryDate, 'YYYY-MM-DD'),
        currentPaidAmount,
        totalPrice,
    }
    try {
        if (id) {
            let procurementHis = await ProcurementHistory.findById(id)
            const proc = await Procurement.findById(procurementHis.procurementId)
            proc.names = names
            proc.categories = categories
            procurementHis.names = names
            procurementHis.orderedQuantity = totalQuantity,
                procurementHis.descriptionProc = description,
                procurementHis.placedBy = placedBy,
                procurementHis.vendorName = vendorName,
                procurementHis.vendorContact = vendorContact,
                procurementHis.vendorId = vendorId || newVendorId,
                procurementHis.status = 'PLACED',
                procurementHis.expectedDeliveryDate = dayjs(expectedDeliveryDate, 'YYYY-MM-DD'),
                procurementHis.currentPaidAmount = currentPaidAmount
            procurementHis.totalPrice = totalPrice

            procurementHis.save()
            proc.save()
            res.status(200).json({
                message: 'Successfully Placed'
            })
        } else {
            let procId
            if (procurementId) {
                procId = procurementId
            } else {
                const procurement = new Procurement({ names, totalQuantity: 0, remainingQuantity: 0, categories })
                const res = await procurement.save()
                procId = res._id
            }
            const procurementHis = new ProcurementHistory({ procurementId: procId, requestedQuantity: totalQuantity, requestedBy, ...newData })
            await procurementHis.save()
            res.status(200).json({
                message: 'Successfully Placed'
            })
        }
    } catch (error) {
        console.log(error)
        loggers.info(`addNewProcurement-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}

exports.rejectOrderRequest = async (req, res) => {
    const { id, description } = req.body
    const procHistory = await ProcurementHistory.findOne({ id: new mongoose.mongo.ObjectId(id), status: "REQUESTED" })
    if (procHistory) {
        procHistory.status = 'REJECTED'
        procHistory.descriptionProc = description
        procHistory.save()
        res.status(200).json({
            message: 'Successfully Rejected'
        })
    } else {
        res.status(400).json({
            message: 'Unable to reject'
        })
    }

}

exports.verifyOrder = async (req, res) => {
    try {
        const { id, quantity } = req.body
        const keys = []
        const paths = []
        if (!isEmpty(req.files)) {
            req.files.map(ele => {
                const key = uuid.v4()
                keys.push(key)
                const [name, type] = ele?.filename ? ele.filename.split('.') : []
                paths.push(`nursery/procurements/${key}.${type}`)
            })
        } else {
            res.status(422).json({
                message: 'Plant Images are required'
            })
            return;
        }
        const procHistory = await ProcurementHistory.findOne({ _id: new mongoose.mongo.ObjectId(id), status: 'PLACED' })
        if (procHistory) {
            procHistory.status = 'VERIFIED'
            procHistory.quantity = quantity
            procHistory.images = paths
            const procurment = await Procurement.findById(procHistory.procurementId);
            procurment.remainingQuantity = procurment.remainingQuantity + quantity
            procurment.totalQuantity = procurment.totalQuantity + quantity
            procurment.lastProcuredOn = new Date()
            if (!isEmpty(req.files)) {
                req.files.map((ele, index) => {
                    const [name, type] = ele.filename ? ele.filename.split('.') : []
                    uploadFile({ file: ele, path: 'nursery/procurements', key: `${keys[index]}.${type}` })
                })
            }
            await procurment.save()
            await procHistory.save()
            res.status(200).json({
                message: 'Successfully Verified'
            })
        } else {
            res.status(400).json({
                message: 'Nothing to verify'
            })
            return
        }
    } catch (error) {
        console.log(error)
        loggers.info(`addNewProcurement-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.uploadInvoiceToOrder = async (req, res) => {
    try {
        const { id } = req.body
        const keys = []
        const paths = []
        if (!isEmpty(req.files)) {
            const procHistory = await ProcurementHistory.findOne({ _id: new mongoose.mongo.ObjectId(id), invoice: '', status: { $in: ['PLACED', 'VERIFIED'] } });
            if (procHistory) {
                req.files.map(ele => {
                    const key = uuid.v4()
                    keys.push(key)
                    const [name, type] = ele?.filename ? ele.filename.split('.') : []
                    paths.push(`nursery/procurements/${key}.${type}`)
                })
                procHistory.invoice = paths[0]
                if (!isEmpty(req.files)) {
                    req.files.map((ele, index) => {
                        const [name, type] = ele.filename ? ele.filename.split('.') : []
                        uploadFile({ file: ele, path: 'nursery/procurements', key: `${keys[index]}.${type}` })
                    })
                }
                await procHistory.save()
                res.status(200).json({
                    message: 'invoice uploaded'
                })
            } else {
                res.status(400).json({
                    message: 'unable to update'
                })
                return
            }
        } else {
            res.status(422).json({
                message: 'Plant Invoice is required'
            })
            return;
        }
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
                const vendorData = new Vendor({ contact: vendorContact, name: vendorName })
                newVendorId = vendorData._id
                await vendorData.save()
            }
            procurement.totalQuantity += totalQuantity
            procurement.remainingQuantity += totalQuantity
            procurement.lastProcuredOn = new Date()
            procurement.categories = [...categories];
            const keys = []
            const paths = []
            if (!isEmpty(req.files)) {
                req.files.map(ele => {
                    const key = uuid.v4()
                    keys.push(key)
                    const [name, type] = ele?.filename ? ele.filename.split('.') : []
                    paths.push(`nursery/procurements/${key}.${type}`)
                })


            }
            const [invoice, ...images] = paths
            const procurementHistoryData = [{
                createdBy,
                quantity: totalQuantity,
                totalPrice,
                procuredOn: new Date(),
                description,
                vendorName,
                vendorContact,
                vendorId: vendorId || newVendorId,
                invoice,
                images,
            }]

            const procurementHistoryDataObj = { ...procurementHistoryData[0], names, procurementId: procurement._id }
            if (procurement.procurementHistory.length >= 10) {
                const newHistory = [...procurement.procurementHistory]
                newHistory.shift()
                newHistory.unshift(procurementHistoryDataObj)
                procurement.procurementHistory = newHistory;
            } else {
                procurement.procurementHistory.unshift(procurementHistoryDataObj)
            }
            console.log('shot', procurement.procurementHistory)
            const procurementHistory = new ProcurementHistory({ ...procurementHistoryDataObj })
            const response = await procurement.save()
            procurementHistory.save()
            if (!isEmpty(req.files)) {
                req.files.map((ele, index) => {
                    const [name, type] = ele.filename ? ele.filename.split('.') : []
                    uploadFile({ file: ele, path: 'nursery/procurements', key: `${keys[index]}.${type}` })
                })

            }
            res.status(201).json({
                message: 'Successfully Created'
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

exports.getAllOrders = async (req, res) => {
    try {
        const { statuses, startDate, endDate, search, sortBy, sortType, pageNumber, isCount } = req.body
        const fields = {
            admin: ['_id', 'names', 'requestedBy', 'requestedQuantity', 'totalPrice', 'currentPaidAmount', 'vendorName', 'vendorContact', 'quantity', 'orderedQuantity','createdAt', 'descriptionProc', 'expectedDeliveryDate', 'placedBy', 'status', 'descriptionSales'],
            procurement: ['_id', 'names', 'requestedQuantity', 'totalPrice', 'currentPaidAmount', 'vendorName', 'vendorContact', 'quantity', 'orderedQuantity', 'createdAt', 'descriptionProc', 'expectedDeliveryDate', 'placedBy', 'status', 'descriptionSales', 'invoice'],
            sales: ['_id', 'names', 'requestedQuantity', 'quantity', 'orderedQuantity', 'createdAt', 'descriptionProc', 'expectedDeliveryDate', 'status', 'descriptionSales'],
        }
        const role = req?.token?.role
        const matchQuery = {}

        if (!isEmpty(statuses)) {
            matchQuery.status = { $in: statuses }
        }

        if (startDate != null && endDate != null) {
            matchQuery.createdAt = {
                $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
                $lt: dayjs(endDate, 'YYYY-MM-DD').add(1, 'day').toDate()
            }
        }
        if (search) {
            matchQuery['names.en.name'] = { $regex: search, $options: "i" }
        }
        const matchPipe = [{
            $match: {
                ...matchQuery
            }
        }]
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
            "plantName": "names.en.name",
            "createdAt": "createdAt"
        }
        const sortStage = [{
            '$sort': {
                [sortVal[sortBy]]: parseInt(sortType)
            }
        }]
        const pipeline = []
        pipeline.push(...matchPipe);
        if (sortBy && sortType) {
            pipeline.push(...sortStage)
        }
        if (isCount) {
            pipeline.push(...count)
        }else{
            let projectFields = fields[role];
            if (projectFields) {
                const project = {}
                projectFields.forEach(f => project[f] = 1)
                pipeline.push({ $project: project })
            }
        }
        if (pageNumber) {
            pipeline.push(...pagination)
        }
        console.log("getAllOrders-pipeline", JSON.stringify(pipeline))
        const orders = await ProcurementHistory.aggregate(pipeline)
        loggers.info(`getAllOrders-pipeline, ${JSON.stringify(pipeline)}`)
        res.json(orders)
    } catch (error) {
        console.log(error)
        loggers.info(`getAllProcurementsHistory-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.updateDeliveryDate = async (req, res)=>{
     const {id, expectedDeliveryDate} = req.body
     const procHistory = await ProcurementHistory.findOne({_id: new mongoose.mongo.ObjectId(id),  status:'PLACED'})
     if(procHistory){
        procHistory.expectedDeliveryDate = dayjs(expectedDeliveryDate, 'YYYY-MM-DD')
        res.status(200).json({
            message: 'Successfully Updated date'
        })
     }else{
        res.status(400).json({
            message: 'Unable to update'
        })
     }
}

exports.getAllProcurements = async (req, res) => {
    const fields = {
        admin: ['_id', 'names', 'totalQuantity', 'remainingQuantity', 'lastProcuredOn', 'procurementHistory', 'variants', 'minimumQuantity', 'categories'],
        procurement: ['_id', 'names', 'totalQuantity', 'remainingQuantity', 'lastProcuredOn', 'procurementHistory', 'categories'],
        sales: ['_id', "names", 'variants', 'categories', 'remainingQuantity'],
        preSales: ['_id', "names", 'variants', 'categories']
    }
    const { pageNumber, search, isCount, sortBy, sortType, isAll } = req.body;
    try {
        const match = [
            {
                '$match': {
                    totalQuantity: { $gt: 0 }
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

        const lookupProcHistory = [
            {
                $lookup: {
                    from: "procurement_histories",
                    let: { procurementId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$$procurementId",
                                        "$procurementId",
                                    ],
                                },
                                status: "VERIFIED",
                            },
                        },
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $limit: 10
                        },
                    ],
                    as: "procurementHistory",
                }
            }
        ]

        const pipeline = []
        pipeline.push(...match)
        if (req?.token?.role === "sales" && !isAll==='true') {
            const salesMatch = [
                {
                    '$match': {
                        "variants.0": { $exists: true }
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
        } else {
            const role = req?.token?.role
            if (['admin', 'procurement'].includes(role)) {
                pipeline.push(...lookupProcHistory)
            }
            let projectFields = fields[role];
            if (projectFields) {
                const project = {}
                projectFields.forEach(f => project[f] = 1)
                pipeline.push({ $project: project })
            }
        }

        console.log("getAllProcurements-pipeline", JSON.stringify(pipeline))
        loggers.info(`getAllProcurements-pipeline, ${JSON.stringify(pipeline)}`)
        const procurements = await Procurement.aggregate(pipeline)
        if (count) {
            res.json(procurements)
        } else {
            const procurementsWithAvg = procurements.map(procurement => {
                const sum = procurement?.procurementHistory?.reduce((acc, ele) => {
                    return acc + (ele.totalPrice / ele.quantity)
                }, 0)
                const averagePrice = (sum / procurement.procurementHistory.length).toFixed(2)
                return { ...procurement, averagePrice }
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
    const mandatory = ['_id', 'createdAt', 'quantity', 'vendorName', 'vendorContact', 'totalPrice', 'invoice', 'images']

    try {
        const match = [
            {
                '$match': {
                    procurementId,
                    createdAt: {
                        $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
                        $lt: dayjs(endDate, 'YYYY-MM-DD').add(1, 'day').toDate()
                    },
                    status: 'VERIFIED'
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

        if (isAverage) {
            const averagePriceStage = {
                $group: {
                    _id: "null",
                    avg: {
                        "$avg": { $divide: ["$totalPrice", "$quantity"] }
                    }
                }
            }
            pipeline.push(averagePriceStage)
        }
        if (!isCount && !isAverage) {
            const project = {}
            mandatory.forEach(f => project[f] = 1)
            pipeline.push({ $project: project })
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
    const { pageNumber, isCount, sortBy, sortType, search } = req.body;
    try {
        const match = [
            {
                '$match': {
                    $expr: {
                        $lt: ["$remainingQuantity", "$minimumQuantity"]
                    }
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
            "minimumQuantity": "minimumQuantity"
        }
        const sortStage = [{
            '$sort': {
                [sortVal[sortBy]]: parseInt(sortType)
            }
        }]

        const pipeline = []
        pipeline.push(...match)
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
        } else {
            const project = {}
            const mandatory = ['_id', 'names', 'totalQuantity', 'remainingQuantity', 'lastProcuredOn', 'procurementHistory']
            if (req.token?.role === 'admin') {
                mandatory.push(...['variants', 'minimumQuantity'])
            }
            mandatory.forEach(f => project[f] = 1)
            pipeline.push({ $project: project })
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

exports.updateDamage = (req, res)=>{
    try {
        const {id, damagedQuantity} = req.body
    } catch (error) {
        
    }
}