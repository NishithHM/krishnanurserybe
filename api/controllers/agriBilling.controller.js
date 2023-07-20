const { isEmpty, uniq } = require("lodash");
const Customer = require('../models/customer.model');
const AgriProcurementModel = require("../models/AgriProcurement.model");
const { handleMongoError } = require("../utils");
const Billing = require("../models/billings.model");
const { default: mongoose } = require("mongoose");
const Tracker = require("../models/tracker.model");
const loggers = require("../../loggers");
const dayjs = require("dayjs");


exports.getAgriItemDetails = async (req, res) => {
      try {
            const { variant, type, name } = req.body
            let variantName = `${type}-${name}`;
            const variantAttributes = variant.map((v) => v.optionValue);
            variantName = `${variantName}(${variantAttributes.join(" ")})`;
            const agriProc = await AgriProcurementModel.findOne({ type, names: variantName }, { maxPrice: 1, minPrice: 1, remainingQuantity: 1 })
            if (isEmpty(agriProc)) {
                  res.status(404).json({
                        message: `${variantName} not found, please contact admin`
                  })
            } else {
                  res.status(200).json({
                        ...agriProc._doc
                  })
            }
      } catch (error) {
            console.log(error)
            loggers.info(`getAgriItemDetails-error, ${error}`)
            const err = handleMongoError(error)
            res.status(500).send(err)
      }


}

exports.agriAddToCart = async (req, res)=>{
      try {
            const { customerNumber, customerName, customerDob, items, customerId } = req.body;
            const soldBy = {
                _id: req?.token?.id,
                name: req?.token?.name
            }
            let customerRes
            if (!customerId) {
                 customerRes = new Customer({ phoneNumber: parseInt(customerNumber, 10), dob: dayjs(customerDob, 'YYYY-MM-DD').toDate(), name: customerName })
            } else {
                customerRes = await Customer.findById(customerId);
            }
            if (!isEmpty(customerRes)) {
                const { errors, formattedItems, totalPrice, discount } = await validatePricesAndQuantityAndFormatItems(items)
                console.log(formattedItems)
                if (isEmpty(errors)) {
                    if (formattedItems.length > 0) {
                       
                        const billing = new Billing({ customerName: customerRes.name, customerId: customerRes._id, customerNumber: customerRes.phoneNumber, soldBy, items: formattedItems, totalPrice, discount, status: "CART", type: 'AGRI' })
                        const cartDetails = await billing.save()
                        res.status(200).send(cartDetails)
                        if(!customerId){
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
            console.log('addToCart-error', JSON.stringify(error))
            const err = handleMongoError(error)
            loggers.info(`addToCart-error, ${error}`)
            res.status(500).send(err)
        }
}

exports.updateAgriCart = async (req, res) => {
      try {
          const { items, id } = req.body;
          const billData = await Billing.findById(id)
          if (billData) {
              const { errors, formattedItems, totalPrice, discount } = await validatePricesAndQuantityAndFormatItems(items)
              if (isEmpty(errors)) {
                  if (formattedItems.length > 0) {
                      billData.items = formattedItems;
                      billData.totalPrice = totalPrice;
                      billData.discount = discount;
                      
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
          loggers.info(`updateAgriCart-error, ${error}`)
          console.log('updateAgriCart-error', error)
          const err = handleMongoError(error)
          res.status(500).send(err)
      }
  
}

exports.confirmAgriCart = async (req, res) => {
      const { id, roundOff = 0} = req.body;
      try {
          const billData = await Billing.findOne({ _id: new mongoose.mongo.ObjectId(id), status: 'CART' })
          if (billData) {
              const roundOfError = validateRoundOff(billData.totalPrice, roundOff);
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
                          "quantity": ele.quantity,
                          "price": ele.rate
                      }
                  })
                  const { errors } = await validatePricesAndQuantityAndFormatItems(itemList)
                  if (isEmpty(errors)) {
                      const billedBy = {
                          _id: req?.token?.id,
                          name: req?.token?.name
                      }
                      billData.totalPrice = billData.totalPrice - roundOff
                      billData.roundOff = roundOff
                      billData.status = "BILLED"
                      billData.billedBy = billedBy
                      const trackerVal = await Tracker.findOne({name:"agriInvoiceId"})
                      billData.invoiceId = `AGR_${trackerVal.number}`
                      updateRemainingQuantity(procurementQuantityMapping)
                      updateCustomerPurchaseHistory(billData)
                      await billData.save()
                      await Tracker.findOneAndUpdate({name:"agriInvoiceId"}, {$inc:{number:1}}, {$upsert:false})
                      res.status(200).send(billData)
                  } else {
                      res.status(400).send({ error: errors.join(' ') })
                  }
  
  
              } else {
                  res.status(400).send({ error: roundOfError })
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

exports.getAgriCart = async (req, res)=>{
    const { id } = req.body;
    try {
        const data = await Billing.findOne({customerId: new mongoose.mongo.ObjectId(id), status:'CART', type:"AGRI"})
        res.status(200).send(data) 
    } catch (error) {
        loggers.info(`getAgriCart-error, ${error}`)
        console.log('getAgriCart-error', error)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
    
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
          const procurment = await AgriProcurementModel.findById(key)
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

const validatePricesAndQuantityAndFormatItems =async (items)=>{
      const procurements = uniq(items.map(ele => new mongoose.mongo.ObjectId(ele.procurementId)))
      const errors = []
      if(items.length > procurements.length){
            errors.push('Duplicate Item found please check')
            return {errors}
      }
      const agriProcs = await AgriProcurementModel.find({_id:{$in: procurements}})
      console.log(agriProcs)
      const formattedItems = []
    let totalPrice = 0;
    let discount = 0
    for (const element of agriProcs) {
        const {
            _id: resultProcurementId,
            names: procurementNames,
            minPrice,
            maxPrice,
            remainingQuantity,
            variant,
            type,
            typeName
        } = element

        const { procurementId: itemProcurmentId, quantity, price} = items.find((ele) => ele.procurementId === resultProcurementId.toString()) || {}
        if (price > maxPrice) {
            errors.push(`"${procurementNames}" should be less than "${maxPrice}"`)
        }
        if (price < minPrice) {
            errors.push(`"${procurementNames}" price is invalid, increase price and try again`)
        }
        if (quantity > remainingQuantity) {
            errors.push(`Ooops!! stock of "${procurementNames}" is low, maximum order can be "${remainingQuantity}"`)
        }
        formattedItems.push({ procurementId: itemProcurmentId, procurementName: {en:{name:procurementNames}}, quantity, mrp: maxPrice, rate: price, variant, type, typeName})
        totalPrice = totalPrice + price * quantity;
        discount = discount + (maxPrice - price) * quantity;
        
    }

    return { errors, formattedItems, totalPrice, discount }


}