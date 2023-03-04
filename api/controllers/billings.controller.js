const Customer = require('../models/customer.model');
const uniq = require('lodash/uniq')
const isEmpty = require('lodash/isEmpty')
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const Procurements = require('../models/procurment.model')
const Billing = require('../models/billings.model');
const { handleMongoError } = require('../utils');
const loggers = require('../../loggers')
exports.addToCart = async (req, res) => {
    try {
        const { customerNumber, customerName, customerDob, items, customerId } = req.body;
        const soldBy = {
            _id: req?.token?.id,
            name:req?.token?.name
        }
        let customerRes
        if (!customerId) {
            const customer = new Customer({ phoneNumber: parseInt(customerNumber, 10), dob: dayjs(customerDob, 'YYYY-MM-DD').toDate(), name: customerName })
            customerRes = await customer.save()
        } else {
            customerRes = await Customer.findById(customerId);
        }
        if (!isEmpty(customerRes)) {
            const {errors, formattedItems, totalPrice, discount } = await validatePricesAndQuantityAndFormatItems(items)
            if (isEmpty(errors)) {
                if(formattedItems.length > 0){
                    const billing = new Billing({customerName: customerRes.name, customerId: customerRes._id, customerNumber: customerRes.phoneNumber, soldBy, items: formattedItems, totalPrice, discount, status: "CART"})
                    const cartDetails = await billing.save()
                    res.status(200).send(cartDetails)
                }else{
                    res.status(400).send({error:'Unable to add empty cart'})
                }
               
            } else {
                res.status(400).send({error:errors.join(',')})
            }

        } else {
            res.status(400).send({error:['Unable to find the customer, please try again']})
        }
    } catch (error) {
        const err = handleMongoError(error)
        loggers.info('addToCart-failure', JSON.stringify(error))
        res.status(500).send(err)
    }

};

exports.updateCart = async (req, res) => {
    try {
        const {items, id } = req.body;
        const billData = await Billing.findById(id)
        if(billData){
            const {errors, formattedItems, totalPrice, discount } = await validatePricesAndQuantityAndFormatItems(items)
            if (isEmpty(errors)) {
                if(formattedItems.length > 0){
                   billData.items = formattedItems;
                   billData.totalPrice = totalPrice;
                   billData.discount = discount;
                   const cartDetails = await billData.save()
                   res.status(200).send(cartDetails)
              }else{
                res.status(400).send({error:'Unable to add empty cart'})
            }
            } else {
                res.status(400).send({error: errors.join(',')})
            }
        }else{
            res.status(400).send("Unable to find the cart items, try again")
        }
    } catch (error) {
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
   
}

exports.confirmCart = async (req, res) =>{
    const { id, roundOff=0} = req.body;
    try {
     const billData = await Billing.findOne({_id: new mongoose.mongo.ObjectId(id), status:'CART'})
     if(billData){
        const roundOfError = validateRoundOff(billData.totalPrice, roundOff);
        if(isEmpty(roundOfError)){
            const procurementQuantityMapping = {}
            const itemList = billData?.items?.map(ele=>{
                if(procurementQuantityMapping[ele.procurementId.toString()]){
                    procurementQuantityMapping[ele.procurementId.toString()] = procurementQuantityMapping[ele.procurementId.toString()] + ele.quantity
                }else{
                    procurementQuantityMapping[ele.procurementId.toString()] = ele.quantity
                }
                return {
                "procurementId": ele.procurementId.toString(),
                "variantId" : ele.variant.variantId.toString(),
                "quantity" : ele.quantity,
                "price": ele.rate
            }})
            const {errors } = await validatePricesAndQuantityAndFormatItems(itemList)
            if(isEmpty(errors)){
                const billedBy = {
                    _id: req?.token?.id,
                    name:req?.token?.name
                }
                billData.totalPrice = billData.totalPrice - roundOff
                billData.roundOff = roundOff
                billData.status = "BILLED"
                billData.billedBy = billedBy
                updateRemainingQuantity(procurementQuantityMapping)
                updateCustomerPurchaseHistory(billData)
                await billData.save()
                res.status(200).send(billData)
            }else{
                res.status(400).send({error:errors.join(' ')})
            }
            
            
        }else{
            res.status(400).send({error: roundOfError})
        }
    }else{
        res.status(400).send("Unable to find the cart items, try again")
    }
        
    } catch (error) {
        console.log("confirmCart-failure", JSON.stringify(error))
        loggers.info("confirmCart-failure", JSON.stringify(error))
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}

exports.getCustomerCart=async(req, res)=>{
    const { id } = req.body;
    try{
        const pipeline = [
            {
              '$match': {
                'customerId': new ObjectId('63ec67d3a57cdb2adb9daabe'), 
                'status': 'CART'
              },
            },{
                '$sort':{
                    updatedAt: -1
                }
            },{
                '$limit':1
            }, {
              '$unwind': {
                'path': '$items'
              }
            }, {
              '$lookup': {
                'from': 'procurements', 
                'let': {
                  'pId': '$items.procurementId', 
                  'vId': '$items.variant.variantId'
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
                '_id': '$customerId', 
                'items': {
                  '$push': '$items'
                }
              }
            }
          ]
          const results = await Billing.aggregate(pipeline)
          res.status(200).send(results[0])
    }catch(error){
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
    
}

const validatePricesAndQuantityAndFormatItems = async (items) => {
    const procurements = uniq(items.map(ele => new mongoose.mongo.ObjectId(ele.procurementId)))
    const variants = uniq(items.map(ele => new mongoose.mongo.ObjectId(ele.variantId)))
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
                    $first: { $mergeObjects: ["$$ROOT.variants", { remainingQuantity: "$$ROOT.remainingQuantity" }, { pNames: "$$ROOT.names" }] }
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
    const results = await Procurements.aggregate(pipeline)
    const errors = []
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
        if (price < minPrice) {
            errors.push(`"${procurementNames?.en?.name}" of variant "${resultVariantNames?.en?.name}" price is invalid, increase price and try again`)
        }
        if (quantity > remainingQuantity) {
            errors.push(`Ooops!! stock of "${procurementNames?.en?.name}" is low, maximum order can be "${remainingQuantity}"`)
        }
        formattedItems.push({procurementId : itemProcurmentId, procurementName:procurementNames, variant:{ variantId: itemVariantId, ...resultVariantNames }, quantity, mrp: maxPrice, rate: price  })
        totalPrice = totalPrice + price * quantity;
        discount = discount + (maxPrice - price) * quantity;
    }

    return {errors, formattedItems, totalPrice, discount}



}

const validateRoundOff = (totalPrice, amount) =>{
    const maxRound = totalPrice * 0.1 > 500 ? 500 : totalPrice*0.1
    if(amount> maxRound){
        return "Round off amount is higher, please reduce and try again later"
    }
    return null
}

const updateRemainingQuantity = async (object)=>{
    const listValues = Object.entries(object);
    for(const [key, value] of listValues){
        const procurment = await Procurements.findById(key)
        procurment.remainingQuantity = procurment.remainingQuantity - value
        await procurment.save()
        // update customer schema
        // new api to get cart items via customer id
    }
}

const updateCustomerPurchaseHistory = async (billData)=>{
    const customerId = billData.customerId
    const  {
        items,
        totalPrice,
        discount,
        roundOff,
        soldBy,
        billedBy,
    } =billData
    const purchaseData = {
        items,
        totalPrice,
        discount,
        roundOff,
        soldBy,
        billedBy,
        billedDate: new Date()
    }
    const customer  = await Customer.findById(customerId);
    if (customer.billingHistory.length > 20) {
        customer.billingHistory.shift()
        customer.billingHistory.push(purchaseData)
    } else {
        customer.billingHistory.push(purchaseData)
    }
    await customer.save()
}




//should not be less than min price , more than max price
//quantity should not be more than remaining quantity
//cross verify total
//should add sales done by
//should add billedby,billed datetime