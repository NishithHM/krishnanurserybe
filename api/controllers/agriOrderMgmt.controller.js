// const lodash = require('lodash')
const Vendor = require('../models/vendor.model')
const AgriOrders = require("../models/agriOrderMgmt.model");
const { handleMongoError, uploadFile } = require('../utils');
const { isEmpty } = require('lodash');
const loggers = require('../../loggers');
const { default: mongoose } = require('mongoose');
const AgriProcurementModel = require('../models/AgriProcurement.model');
const uuid = require('uuid')
exports.requestAgriOrder = async (req, res) => {
    try {
        const { orders, descrption } = req.body
        const requestedBy = {
            _id: req?.token?.id,
            name: req?.token?.name
        }
        const orderPromises = orders.map(order => {
            const { totalQuantity, type, name, variant } = order
            let variantName = `${type}-${name}`;
            const variantAttributes = variant.map(v => v.optionValue)
            variantName = `${variantName}(${variantAttributes.join(' ')})`
            const orderData = new AgriOrders({ names: variantName, requestedQuantity: totalQuantity, requestedBy, descriptionSales: descrption, variant, status: "REQUESTED", type })
            return orderData.save()
        });
        await Promise.all(orderPromises)
        res.send({
            message: 'Order Placed Succesfully'
        })
    } catch (error) {
        console.log('agriRequest-error', JSON.stringify(error))
        loggers.info(`agriRequest-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.placeAgriOrder = async (req, res) => {
    try {
        const { orders, descrption, currentPaidAmount, orderId, vendorName, vendorContact, expectedDeliveryDate, vendorId } = req.body
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

        for (let i = 0; i < orders.length; i++) {
            const { totalQuantity, type, name, variant, id, totalPrice } = orders[i]
            if (id) {
                const data = await AgriOrders.findById(id);
                if (data) {
                    data.orderedQuantity = totalQuantity
                    data.placedBy = placedBy
                    data.vendorName = vendorName,
                        data.vendorContact = vendorContact,
                        data.vendorId = vendorId || newVendorId,
                        data.status = 'PLACED',
                        data.orderId = orderId
                    data.expectedDeliveryDate = dayjs(expectedDeliveryDate, 'YYYY-MM-DD'),
                        data.currentPaidAmount = currentPaidAmount
                    data.totalPrice = totalPrice
                    await data.save()
                }
            } else {
                let variantName = `${type}-${name}`;
                const variantAttributes = variant.map(v => v.optionValue)
                variantName = `${variantName}(${variantAttributes.join(' ')})`
                const orderData = new AgriOrders(
                    {
                        names: variantName,
                        requestedQuantity: totalQuantity,
                        requestedBy: placedBy,
                        descriptionSales: descrption,
                        variant,
                        status: "PLACED",
                        orderedQuantity: totalQuantity,
                        placedBy,
                        vendorName,
                        vendorContact,
                        vendorId: vendorId || newVendorId,
                        orderId,
                        expectedDeliveryDate,
                        totalPrice,
                        type
                    })
                await orderData.save()
            }
        }
        res.send({
            message: 'Order Placed Succesfully'
        })
    } catch (error) {
        console.log(`agriOrderPlace-error, ${JSON.stringify(error)}`)
        loggers.info(`agriOrderPlace-error, ${JSON.stringify(error)}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }



}

exports.agriOrderList = async (req, res) => {
    try {
        const { status, vendors, startDate, endDate, search, sortBy, sortType, pageNumber, isCount } = req.body
        const fields = {
            admin: ['_id', 'names', 'requestedBy', 'requestedQuantity', 'totalPrice', 'currentPaidAmount', 'vendorName', 'vendorContact', 'quantity', 'orderedQuantity', 'createdAt', 'descriptionProc', 'expectedDeliveryDate', 'placedBy', 'status', 'descriptionSales', 'vendorId', 'orderId'],
            procurement: ['_id', 'names', 'requestedQuantity', 'totalPrice', 'currentPaidAmount', 'vendorName', 'vendorContact', 'quantity', 'orderedQuantity', 'createdAt', 'descriptionProc', 'expectedDeliveryDate', 'placedBy', 'status', 'descriptionSales', 'invoice', 'procurementId', 'vendorId', 'orderId'],
            sales: ['_id', 'names', 'requestedQuantity', 'quantity', 'orderedQuantity', 'createdAt', 'descriptionProc', 'expectedDeliveryDate', 'status', 'descriptionSales'],
        }
        const role = req?.token?.role
        const matchQuery = {}

        if (!isEmpty(status)) {
            matchQuery.status = { $in: status }
        }

        if (!isEmpty(vendors)) {
            matchQuery.vendorId = { $in: vendors }
        }

        if (startDate != null && endDate != null) {
            matchQuery.createdAt = {
                $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
                $lt: dayjs(endDate, 'YYYY-MM-DD').add(1, 'day').toDate()
            }
        }
        if (search) {
            if (parseInt(search, 10) > 0) {
                matchQuery['$expr'] = {
                    "$regexMatch": {
                        "input": { "$toString": "$orderId" },
                        "regex": search
                    }
                }
            } else {
                matchQuery['names'] = { $regex: search, $options: "i" }
            }
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
            "names": "names",
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
        } else {
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
        console.log("agriOrderList-pipeline", JSON.stringify(pipeline))
        const orders = await AgriOrders.aggregate(pipeline)
        loggers.info(`agriOrderList-pipeline, ${JSON.stringify(pipeline)}`)
        res.json(orders)
    } catch (error) {
        console.log(`agriOrderList-error, ${JSON.stringify(error)}`)
        loggers.info(`agriOrderList-error, ${JSON.stringify(error)}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}

exports.verifyAgriOrder = async (req, res)=>{
    try {
        const { id, quantity } = req.body
        const keys = []
        const paths = []
        if (!isEmpty(req.files)) {
            req.files.map(ele => {
                const key = uuid.v4()
                keys.push(key)
                const [name, type] = ele?.filename ? ele.filename.split('.') : []
                paths.push(`agri/procurements/${key}.${type}`)
            })
        } else {
            res.status(422).json({
                message: 'Agri Images are required'
            })
            return;
        }
        const order = await AgriOrders.findOne({_id: new mongoose.mongo.ObjectId(id), status:"PLACED"})
        if(order){
            order.status = "VERIFIED"
            order.quantity = quantity
            order.images = paths
            const agriProc = await AgriProcurementModel.findOne({names:order.names})
            if(!isEmpty(agriProc)){
                agriProc.remainingQuantity = agriProc.remainingQuantity + quantity
                agriProc.lastProcuredOn = new Date()
                await agriProc.save()
            }else{
                const newAgriProc = new AgriProcurementModel({names: order.names, type: order.type, remainingQuantity: quantity, lastProcuredOn: new Date() }) 
                await newAgriProc.save()
            }
            if (!isEmpty(req.files)) {
                req.files.map((ele, index) => {
                    const [name, type] = ele.filename ? ele.filename.split('.') : []
                    uploadFile({ file: ele, path: 'agri/procurements', key: `${keys[index]}.${type}` })
                })
            }
            await order.save()
            res.status(200).json({
                message: 'Successfully Verified'
            })
        }else{
            res.status(404).json({
                message: 'Order Not Found'
            })
        }
    } catch (error) {
        console.log(error)
        console.log(`verifyAgriOrder-error, ${JSON.stringify(error)}`)
        loggers.info(`verifyAgriOrder-error, ${JSON.stringify(error)}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}