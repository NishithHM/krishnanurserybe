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
                    billData.items = formattedItems;
                    billData.totalPrice = totalPrice;
                    billData.discount = discount;
                    billData.isWholeSale = isWholeSale
                    billData.isApproved = false
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
        const billData = await Billing.findOne({ _id: new mongoose.mongo.ObjectId(id), status: 'CART' })
        if (billData) {
            loggers.info("fetched-bill-data",id)
            const roundOfError = validateRoundOff(billData.totalPrice, roundOff);
            if(billData.isApproved || !billData.isWholeSale){
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
                        billData.totalPrice = billData.totalPrice - roundOff
                        billData.roundOff = roundOff
                        billData.status = "BILLED"
                        billData.billedBy = billedBy
                        billData.billedDate = new Date()
                        billData.paymentInfo = paymentInfo
                        billData.cashAmount = cashAmount
                        billData.paymentType = paymentType
                        billData.onlineAmount = onlineAmount
                        const trackerVal = await Tracker.findOne({name:"invoiceId"})
                        loggers.info("fetched-bill-tracker", JSON.stringify({tracker:trackerVal.number, id}))
                        console.log("fetched-bill-tracker", JSON.stringify({tracker:trackerVal.number, id}))
                        billData.invoiceId = `NUR_${trackerVal.number}`
                        await billData.save()
                        await updateRemainingQuantity(procurementQuantityMapping)
                        if (billData.customerNumber !== 1234567890) {
                            await updateCustomerPurchaseHistory(billData)
                        }
                        trackerVal.number = trackerVal.number + 1
                        await trackerVal.save()
                        const trackerValNew = await Tracker.findOne({name:"invoiceId"})
                        loggers.info("fetched-bill-tracker-new", JSON.stringify({ttracker:trackerValNew.number, id}))
                        res.status(200).send(billData)
                    } else {
                        res.status(400).send({ error: errors.join(' ') })
                    }


                } else {
                    res.status(400).send({ error: roundOfError })
                }
            }else{
                res.status(400).send("Bill not approved by admin. Please try again")
            }
        } else {
            res.status(400).send("Unable to find the cart items, try again")
        }

    } catch (error) {
        loggers.info(`confirm-cart-error, ${error}`)
        console.log('confirm-cart-error', error)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}

exports.getCustomerCart = async (req, res) => {
    const { id } = req.body;
    try {
        const pipeline = [
            {
                '$match': {
                    'customerId': new mongoose.mongo.ObjectId(id),
                    'status': 'CART',
                    type:"NURSERY"
                },
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
            status: "BILLED",
            type
        }
        if (req.token?.role === "admin") {
             initialMatch = {
                $or:[{status: "BILLED"}, {status:"CART", isApproved: false, isWholeSale: true}],
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
    const billData = await Billing.findOne({ _id: new mongoose.mongo.ObjectId(id), status: 'CART' })
    billData.isApproved = true
    billData.approvedBy = approvedBy
    billData.approvedOn = new Date()
    await billData.save()
    res.json(billData.toJSON())
}




//should not be less than min price , more than max price
//quantity should not be more than remaining quantity
//cross verify total
//should add sales done by
//should add billedby,billed datetime