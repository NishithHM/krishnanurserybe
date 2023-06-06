// const lodash = require('lodash')
const Vendor = require('../models/vendor.model')
const AgriOrders = require("../models/agriOrderMgmt.model");
const { handleMongoError } = require('../utils');
const { isEmpty } = require('lodash');
const loggers = require('../../loggers');

exports.requestAgriOrder = async (req, res) => {
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
        const orderData = new AgriOrders({ names: variantName, requestedQuantity: totalQuantity, requestedBy, descriptionSales: descrption, variant, status: "REQUESTED" })
        return orderData.save()
    });
    await Promise.all(orderPromises)
    res.send({
        message: 'Order Placed Succesfully'
    })
}

exports.placeAgriOrder = async (req, res) => {
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
                    totalPrice
                })
           await orderData.save()
        }
    }
    res.send({
        message: 'Order Placed Succesfully'
    })


}

exports.agriOrderList = async (req, res)=>{
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

        if(!isEmpty(vendors)){
            matchQuery.vendorId = {$in: vendors}
        }

        if (startDate != null && endDate != null) {
            matchQuery.createdAt = {
                $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
                $lt: dayjs(endDate, 'YYYY-MM-DD').add(1, 'day').toDate()
            }
        }
        if (search) {
            if(parseInt(search, 10) > 0){
                matchQuery['$expr']= {
                    "$regexMatch": {
                        "input": {"$toString": "$orderId"}, 
                        "regex": search
                     }
                }
            }else{
                matchQuery['names']  = { $regex: search, $options: "i" }
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
        console.log(error)
        loggers.info(`agriOrderList-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}