const Customer = require('../models/customer.model');
const uniq = require('lodash/uniq')
const isEmpty = require('lodash/isEmpty')
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const Procurements = require('../models/procurment.model')
const Billing = require('../models/billings.model');
const { handleMongoError } = require('../utils');
const loggers = require('../../loggers');
const { uniqBy } = require('lodash');
const Tracker = require('../models/tracker.model');
const MetaData = require('../models/metaData.model');

exports.addToCart = async (req, res) => {
    try {
        const { customerNumber, customerName, customerDob, items, customerId, isWholeSale } = req.body;
        const soldBy = {
            _id: req?.token?.id,
            name: req?.token?.name
        }
        let customerRes
        if (!customerId) {
            if (customerNumber !== '1234567890') {
                customerRes = new Customer({ phoneNumber: parseInt(customerNumber, 10), dob: dayjs(customerDob, 'YYYY-MM-DD').toDate(), name: customerName })
            } else {
                const ObjectId = mongoose.Types.ObjectId
                customerRes = { _id: new ObjectId(), name: customerName, phoneNumber: parseInt('1234567890') }
            }
        }else{
            customerRes = await Customer.findById(customerId);
        }
        if (!isEmpty(customerRes)) {
            const { errors, formattedItems, totalPrice, discount } = await validatePricesAndQuantityAndFormatItems(items, isWholeSale)
            if (isEmpty(errors)) {
                if (formattedItems.length > 0) {
                   
                    const billing = new Billing({ customerName: customerRes.name, customerId: customerRes._id, customerNumber: customerRes.phoneNumber, soldBy, items: formattedItems, totalPrice, discount, status: "CART", type:'NURSERY' , isWholeSale, isApproved: false })
                    const cartDetails = await billing.save()
                    res.status(200).send(cartDetails)
                    if(!customerId &&  customerNumber !== '1234567890'){
                        customerRes.save()
                    }
                } else {
                    res.status(400).send({ error: 'Unable to add empty cart' })
                }

            } else {
                res.status(400).send({ error: errors.join(',') })
            }

        } else {
            res.status(400).send({ error: 'Unable to find the customer, please try again' })
        }
    } catch (error) {
        const err = handleMongoError(error)
        loggers.info(`addToCart-error, ${error}`)
        console.log('addToCart-error', error)
        res.status(500).send(err)
    }

};

exports.updateCart = async (req, res) => {
    try {
        const { items, id , isWholeSale} = req.body;
        const billData = await Billing.findById(id)
        if (billData) {
            const { errors, formattedItems, totalPrice, discount } = await validatePricesAndQuantityAndFormatItems(items, isWholeSale)
            if (isEmpty(errors)) {
                if (formattedItems.length > 0) {
                    billData.totalPrice = totalPrice;
                    billData.discount = discount;
                    billData.isWholeSale = isWholeSale
                    billData.isApproved = false
                    if (billData.status === 'BILLED') {
                        billData.status = 'RE_CART'
                        billData.oldBilledItems = billData.items
                    }
                    billData.items = formattedItems;
                    const cartDetails = await billData.save()
                    res.status(200).send(cartDetails)
                } else {
                    res.status(400).send({ error: 'Unable to add empty cart' })
                }
            } else {
                res.status(400).send({ error: errors.join(',') })
            }
        } else {
            res.status(400).send({ error: "Unable to find the cart items, try again" })
        }
    } catch (error) {
        loggers.info(`updateCart-error, ${error}`)
        console.log('updateCart-error', error)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.confirmCart = async (req, res) => {
    const { id, roundOff = 0, paymentInfo, paymentType, cashAmount, onlineAmount} = req.body;
    try {
        const billData = await Billing.findOne({ _id: new mongoose.mongo.ObjectId(id), status: { $in: ['CART', 'RE_CART'] } })
        if (billData) {
            loggers.info("fetched-bill-data",id)
            const roundOfError = validateRoundOff(billData.totalPrice, roundOff);
            if( isCartApproved(billData)){
                if (isEmpty(roundOfError)) {
                    const procurementQuantityMapping = {}
                    const itemList = billData?.items?.map(ele => {
                        if (procurementQuantityMapping[ele.procurementId.toString()]) {
                            procurementQuantityMapping[ele.procurementId.toString()] = procurementQuantityMapping[ele.procurementId.toString()] + ele.quantity
                        } else {
                            procurementQuantityMapping[ele.procurementId.toString()] = ele.quantity
                        }
                        return {
                            "procurementId": ele.procurementId.toString(),
                            "variantId": ele.variant.variantId.toString(),
                            "quantity": ele.quantity,
                            "price": ele.rate
                        }
                    })
                    const isWholeSale = billData.isWholeSale
                    const { errors } = await validatePricesAndQuantityAndFormatItems(itemList, isWholeSale)
                    if (isEmpty(errors)) {
                        const billedBy = {
                            _id: req?.token?.id,
                            name: req?.token?.name
                        }
                        const status = billData.status
                        const oldCashAmount = billData.cashAmount
                        const oldOnlineAmount = billData.onlineAmount
                        const oldRoundOff = billData.roundOff
                        billData.totalPrice = billData.totalPrice - roundOff
                        billData.roundOff = roundOff
                        billData.status = "BILLED"
                        billData.billedBy = billedBy
                        billData.paymentInfo = paymentInfo
                        billData.cashAmount = cashAmount
                        billData.paymentType = paymentType
                        billData.onlineAmount = onlineAmount
                        let trackerVal
                        if(status === 'CART'){
                            trackerVal = await Tracker.findOne({name:"invoiceId"})
                            loggers.info("fetched-bill-tracker", JSON.stringify({tracker:trackerVal.number, id}))
                            console.log("fetched-bill-tracker", JSON.stringify({tracker:trackerVal.number, id}))
                            billData.invoiceId = `NUR_${trackerVal.number}`
                            billData.billedDate = new Date()
                        }
                        if (status === 'RE_CART') {
                          const is_error =  await updateCronJobData(billData.toJSON(), oldCashAmount, oldOnlineAmount, oldRoundOff)
                          if(is_error){
                            res.status(400).send({ error: 'quantity cannot be increased while returning' })
                            return
                          }
                        }
                        await billData.save()
                        if (billData.customerNumber !== 1234567890) {
                            await updateCustomerPurchaseHistory(billData)
                        }
                        if (status === 'CART') {
                            await updateRemainingQuantity(procurementQuantityMapping)
                            trackerVal.number = trackerVal.number + 1
                            await trackerVal.save()
                            const trackerValNew = await Tracker.findOne({name:"invoiceId"})
                            loggers.info("fetched-bill-tracker-new", JSON.stringify({ttracker:trackerValNew.number, id}))
                        }
                        res.status(200).send(billData)
                    } else {
                        res.status(400).send({ error: errors.join(' ') })
                    }


                } else {
                    res.status(400).send({ error: roundOfError })
                }
            }else{
                res.status(400).send({ error: 'Cart is not approved, please approve and try again' })
            }
        } else {
            res.status(400).send({ error: 'Unable to find the cart items, try again' })
        }

    } catch (error) {
        loggers.info(`confirm-cart-error, ${error}`)
        console.log('confirm-cart-error', error)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}

exports.getCustomerCart = async (req, res) => {
    const { id, billId } = req.body;
    const match = {
                    'customerId': new mongoose.mongo.ObjectId(id),
                    'status': 'CART',
                    type:"NURSERY"
                }
    if (billId) {
        match._id = new mongoose.mongo.ObjectId(billId)
        match.status = { $in: ['BILLED', 'RE_CART'] }
    }            
    try {
        const pipeline = [
            {
                '$match': match,
            }, {
                '$sort': {
                    updatedAt: -1
                }
            }, {
                '$limit': 1
            }, {
                '$unwind': {
                    'path': '$items'
                }
            }, {
                '$lookup': {
                    'from': 'procurements',
                    'let': {
                        'pId': '$items.procurementId',
                        'vId': "$items.variant.variantId"
                    },
                    'pipeline': [
                        {
                            '$match': {
                                '$expr': {
                                    '$and': [
                                        {
                                            '$eq': [
                                                '$_id', '$$pId'
                                            ]
                                        }
                                    ]
                                }
                            }
                        }, {
                            '$unwind': {
                                'path': '$variants'
                            }
                        }, {
                            '$match': {
                                '$expr': {
                                    '$and': [
                                        {
                                            '$eq': [
                                                '$variants._id', "$$vId"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }, {
                            '$project': {
                                'variants': 1
                            }
                        }
                    ],
                    'as': 'result'
                }
            }, {
                '$unwind': {
                    'path': '$result'
                }
            }, {
                '$addFields': {
                    'items.maxPrice': '$result.variants.maxPrice',
                    'items.minPrice': '$result.variants.minPrice'
                }
            }, {
                '$group': {
                    '_id': '$_id',
                    'items': {
                        '$push': '$items'
                    },
                    'isApproved':{
                        $last:"$isApproved"
                      },
                    'isWholeSale':{
                         $last:"$isWholeSale"
                    },
                    totalPrice:{
                        $last:"$totalPrice"
                      },
                      discount:{
                        $last:"$discount"
                      },
                      roundOff:{
                        $last:"$roundOff"
                      } 
                }
            }
        ]
        loggers.info(`getCustomerCart-pipeline, ${JSON.stringify(pipeline)}`)
        console.log('getCustomerCart-pipeline', JSON.stringify(pipeline))
        const results = await Billing.aggregate(pipeline)
        res.status(200).send(results[0])
    } catch (error) {
        loggers.info(`getCustomerCart-error, ${error}`)
        console.log('getCustomerCart-error', error)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

const validatePricesAndQuantityAndFormatItems = async (items, isWholeSale) => {
    const procurements = uniq(items.map(ele => new mongoose.mongo.ObjectId(ele.procurementId)))
    const variants = uniq(items.map(ele => new mongoose.mongo.ObjectId(ele.variantId)))
    const itemsProcurmentAndVariants = items.map(ele=> ele.variantId+ele.procurementId)
    const uniqItems = uniq(itemsProcurmentAndVariants)
    const errors = []

    if(itemsProcurmentAndVariants.length > uniqItems.length){
        errors.push('Duplicate Item found please check')
        return {errors}
    }
    const pipeline = [
        {
            '$match': {
                '_id': {
                    '$in': procurements
                }
            }
        }, {
            '$unwind': {
                'path': '$variants',
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$match': {
                'variants._id': {
                    '$in': variants
                }
            }
        }, {
            '$group': {
                '_id': {
                    'procurementId': '$_id',
                    'variantId': '$variants._id'
                },
                'val': {
                    $first: { $mergeObjects: ["$$ROOT.variants", { remainingQuantity: {$subtract:[ "$$ROOT.remainingQuantity", "$$ROOT.underMaintenanceQuantity" ]}, }, { pNames: "$$ROOT.names" }] }
                }
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [
                        '$_id', '$val'
                    ]
                }
            }
        }
    ]
    console.log("validatePricesAndQuantity", JSON.stringify(pipeline))
    loggers.info(`validatePricesAndQuantity, ${pipeline}`)
    const results = await Procurements.aggregate(pipeline)
    const formattedItems = []
    let totalPrice = 0;
    let discount = 0
    for (const element of results) {
        const {
            procurementId: resultProcurementId,
            variantId: resultVariantId,
            names: resultVariantNames,
            pNames: procurementNames,
            minPrice,
            maxPrice,
            remainingQuantity,
        } = element

        const { procurementId: itemProcurmentId, variantId: itemVariantId, quantity, price } = items.find((ele) => ele.procurementId === resultProcurementId.toString() && ele.variantId === resultVariantId.toString()) || {}
        if (price > maxPrice) {
            errors.push(`"${procurementNames?.en?.name}" of variant "${resultVariantNames?.en?.name}" should be less than "${maxPrice}"`)
        }
        if (price < minPrice && !isWholeSale) {
            errors.push(`"${procurementNames?.en?.name}" of variant "${resultVariantNames?.en?.name}" price is invalid, increase price and try again`)
        }
        if (quantity > remainingQuantity) {
            errors.push(`Ooops!! stock of "${procurementNames?.en?.name}" is low, maximum order can be "${remainingQuantity}"`)
        }
        formattedItems.push({ procurementId: itemProcurmentId, procurementName: procurementNames, variant: { variantId: resultVariantId, ...resultVariantNames }, quantity, mrp: maxPrice, rate: price })
        totalPrice = totalPrice + price * quantity;
        discount = discount + (maxPrice - price) * quantity;
    }

    return { errors, formattedItems, totalPrice, discount }



}

const validateRoundOff = (totalPrice, amount) => {
    let maxRound = 0
    if(totalPrice <= 1000){
        maxRound = 50
    }else if(totalPrice > 1000 && totalPrice <= 5000){
        maxRound = 300
    }else if(totalPrice > 5009 && totalPrice <= 10000){
        maxRound = 500
    }else if(totalPrice > 10000 && totalPrice <= 50000){
        maxRound = 5000
    }else if(totalPrice > 50000){
        maxRound = 10000
    }

    if (amount > maxRound) {
        return "Round off amount is higher, please reduce and try again later"
    }
    return null
}

const updateRemainingQuantity = async (object) => {
    const listValues = Object.entries(object);
    for (const [key, value] of listValues) {
        const procurment = await Procurements.findById(key)
        procurment.remainingQuantity = procurment.remainingQuantity - value
        procurment.soldQuantity = value
        await procurment.save()
        // update customer schema
        // new api to get cart items via customer id
    }
}

const updateCustomerPurchaseHistory = async (billData) => {
    const customerId = billData.customerId
    const {
        items,
        totalPrice,
        discount,
        roundOff,
        soldBy,
        billedBy,
    } = billData
    const purchaseData = {
        items,
        totalPrice,
        discount,
        roundOff,
        soldBy,
        billedBy,
        billedDate: new Date()
    }
    const customer = await Customer.findById(customerId);
    if (customer.billingHistory.length >= 20) {
        customer.billingHistory.shift()
        customer.billingHistory.unshift(purchaseData)
    } else {
        customer.billingHistory.unshift(purchaseData)
    }
    await customer.save()
}

exports.getAllBillingHistory = async (req, res) => {
    const { pageNumber, isCount, id, startDate, endDate, sortBy, sortType, search, type } = req.body;
    try {
        let initialMatch = {
            status: { $in: ['BILLED', 'RE_CART'] },
            type
        }
        if (req.token?.role === "admin") {
             initialMatch = {
                $or:[{status: "BILLED"}, {status:"CART", isApproved: false, isWholeSale: true}, {status:"RE_CART", isApproved: false}],
                type
            }
          }

        if(startDate && endDate){
            initialMatch.billedDate = {
                $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
                $lt: dayjs(endDate, 'YYYY-MM-DD').add(1, 'day').toDate()
            }
        }

        const match = [
            {
                '$match': {...initialMatch}
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
        let sortStage
        if (sortBy) {
            sortStage = [{
                '$sort': {
                    status: -1,
                    [sortBy]: parseInt(sortType)
                }
            }]
        } else {
            sortStage = [{
                '$sort': {
                    updatedAt: -1
                }
            }]
        }

        const numberSearch = /^\d+$/.test(search) ? parseInt(search) : search;

        const searchMatch = [
            {
                '$match': {
                   $or: [ {customerName: { $regex: search, $options: "i" }}, {invoiceId: { $regex: search, $options: "i" }}, {customerNumber: numberSearch}]
                }
            },
        ]
        const pipeline = []
        pipeline.push(...match)
        if (search) {
            pipeline.push(...searchMatch)
        }
        pipeline.push(...sortStage)

        if (pageNumber) {
            pipeline.push(...pagination)
        }

        if (isCount) {
            pipeline.push(...count)
        }

        console.log("getAllBillingHistory-pipeline", JSON.stringify(pipeline))
        const results = await Billing.aggregate(pipeline)
        loggers.info(`getAllBillingHistory-pipeline, ${JSON.stringify(pipeline)}`)
        res.json(results)
    } catch (error) {
        console.log(error)
        loggers.info(`getAllProcurementsHistory-errr, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}

exports.approveBill = async (req, res)=>{
    const {id} = req.body
    const approvedBy = {
        _id: req?.token?.id,
        name: req?.token?.name
    }
    const billData = await Billing.findOne({ _id: new mongoose.mongo.ObjectId(id), status: { $in: ['CART', 'RE_CART'] } })
    billData.isApproved = true
    billData.approvedBy = approvedBy
    billData.approvedOn = new Date()
    await billData.save()
    res.json(billData.toJSON())
}

exports.getBillById = async (req, res)=>{
    const {id} = req.body
    const billData = await Billing.findOne({ _id: new mongoose.mongo.ObjectId(id), status: { $in: ['BILLED', 'RE_CART'] } })
    res.json(billData.toJSON())
}

const updateCronJobData = async (billData, oldCashAmount, oldOnlineAmount, oldRoundOff) => {
    const items = billData?.items
    const oldBilledItems = billData?.oldBilledItems
    const billedDate = dayjs(dayjs(billData.billedDate), 'YYYY-MM-DD').startOf('day').add(330, 'minute').toDate()
    const diff = []
    const newlyAddedItems = items.filter(ele => !oldBilledItems.find(item => item.procurementId.toString() === ele.procurementId.toString() && item.variant.variantId.toString() === ele.variant.variantId.toString()))

    oldBilledItems.forEach(ele => {
        const {quantity:oldQty, mrp:oldMrp, rate:oldRate, procurementId, variant} = ele
        const item = items.find(item => item.procurementId.toString() === ele.procurementId.toString() && item.variant.variantId.toString() === ele.variant.variantId.toString())
        diff.push({procurementId, variant, removedQuantity: oldQty - (item ? item.quantity : 0), saleAmountDiff: oldQty * oldRate - (item ? item.quantity * item.rate : 0)})
    })

    const is_error = diff.some(ele => {
        return ele.removedQuantity < 0
    })

    if(is_error){
        return true
    }


    for (const element of diff) {
        const {procurementId, variant, removedQuantity, saleAmountDiff} = element
        console.log("query", JSON.stringify({procurementId: new mongoose.mongo.ObjectId(procurementId), date: billedDate, type: "NURSERY"}))
        const metaData = await MetaData.findOne({procurementId: new mongoose.mongo.ObjectId(procurementId), date: billedDate, type: "NURSERY"})
        const bill_data = metaData?.bill_data || []
        const new_bill = []
        for (const bill of bill_data) {
            if (bill.variant.variantId.toString() === variant.variantId.toString()) {
                bill.quantity = bill.quantity - removedQuantity
                bill.saleAmount = bill.saleAmount - saleAmountDiff
                bill.salePerQuantity = bill.saleAmount / bill.quantity
            }
            new_bill.push(bill)
        }
        console.log("bill_data", metaData._id)
        metaData.set('bill_data', new_bill)
        console.log("metaData", metaData.toJSON())
        const sales = metaData.sales 
        sales.totalQuantity = sales.totalQuantity - removedQuantity
        sales.totalSales = sales.totalSales - saleAmountDiff
        await MetaData.findByIdAndUpdate(metaData._id, metaData.toJSON())
        const procurment = await Procurements.findById(procurementId)
        procurment.remainingQuantity = procurment.remainingQuantity + removedQuantity
        await procurment.save()
    }

    for (const element of newlyAddedItems) {
        const {procurementId, variant, quantity, rate} = element
        const procurement = await Procurements.findById(procurementId)
        procurement.remainingQuantity = procurement.remainingQuantity - quantity
        await procurement.save()
        const metaData = await MetaData.findOne({procurementId: new mongoose.mongo.ObjectId(procurementId), date: billedDate, type: "NURSERY"})
        if (metaData) {
            const bill_data = metaData?.bill_data || []
            const sales = metaData.sales
            for (const bill of bill_data) {
                if (bill.variant.variantId.toString() === variant.variantId.toString()) {
                    bill.quantity = bill.quantity + quantity
                    bill.saleAmount = bill.saleAmount + quantity * rate
                    bill.salePerQuantity = bill.saleAmount / bill.quantity
                }
            }
            sales.totalQuantity = sales.totalQuantity + quantity
            sales.totalSales = sales.totalSales + quantity * rate
        }else{
            const newMetaData = new MetaData({
                procurementId: new mongoose.mongo.ObjectId(procurementId),
                name: procurement.names,
                remainingQuantity: procurement.remainingQuantity,
                underMaintenanceQuantity: procurement.underMaintenanceQuantity,
                category: procurement.category,
                date: billedDate,
                type: "NURSERY",
                bill_data: [{ variant, quantity, saleAmount: quantity * rate, salePerQuantity: rate }],
                sales: { totalQuantity: quantity, totalSales: quantity * rate }
            })
            await MetaData.create(newMetaData.toJSON())
        }
    }

    const metaData = await MetaData.findOne({date: billedDate, type: "ROUNDOFF"})
    metaData.set('totalRoundOff', metaData.totalRoundOff - (oldRoundOff - billData.roundOff))
    metaData.set('totalCashAmount', metaData.totalCashAmount - (oldCashAmount - billData.cashAmount))
    metaData.set('totalOnlineAmount', metaData.totalOnlineAmount - (oldOnlineAmount - billData.onlineAmount))
    await MetaData.findByIdAndUpdate(metaData._id, metaData.toJSON())
    return false

}

const isCartApproved = (billData) => {
    if(billData.isWholeSale && !billData.isApproved){
        return false
    }

    if(billData.status === 'RE_CART' && !billData.isApproved){
        return false
    }
    return true
}
