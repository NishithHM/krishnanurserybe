const Customer = require('../models/customer.model');
const uniq = require('lodash/uniq')
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const Procurements = require('../models/procurment.model')

exports.addToCart = async (req, res) => {
//   console.log(req.body);
  const {customerNumber, customerName, customerDob, items, customerId } = req.body;
  if(!customerId){
    const customer = new Customer({phoneNumber: customerNumber, dob: dayjs(customerDob, 'YYYY-MM-DD').toDate(), name: customerName})
    // customer.save()
  }
  
  const errors = await validatePricesAndQuantity(items)

  res.status(200).send(errors)
};

const validatePricesAndQuantity=async(items)=>{
        const procurements = uniq(items.map(ele=>  new mongoose.mongo.ObjectId(ele.procurementId)))
        const variants = uniq(items.map(ele=> new mongoose.mongo.ObjectId(ele.variantId)))
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
                    $first: {$mergeObjects:["$$ROOT.variants", {remainingQuantity:"$$ROOT.remainingQuantity"}, {pNames:"$$ROOT.names"}]}
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
        console.log(results)
        const errors = []
        for(const element of results){
            const {
                procurementId: resultProcurementId,
                variantId: resultVariantId,
                names: resultVariantNames,
                pNames: procurementNames,
                minPrice,
                maxPrice,
                remainingQuantity,
              } = element
              
            const {procurementId: itemProcurmentId, itemVariantId, quantity, price} = items.find((ele)=> ele.procurementId === resultProcurementId.toString() && ele.variantId === resultVariantId.toString()) || {}
            if(price > maxPrice){
                errors.push(`"${procurementNames?.en?.name}" of variant "${resultVariantNames?.en?.name}" should be less than "${maxPrice}"`)
            }
            if(price < minPrice){
                errors.push(`"${procurementNames?.en?.name}" of variant "${resultVariantNames?.en?.name}" price is invalid, increase price and try again`) 
            }
            if(quantity > remainingQuantity){
                errors.push(`Ooops!! stock of "${procurementNames?.en?.name}" is low, maximum order can be "${remainingQuantity}"`) 
            }
        }

        return errors



}   


//should not be less than min price , more than max price
//quantity should not be more than remaining quantity
//cross verify total
//should add sales done by
//should add billedby,billed datetime