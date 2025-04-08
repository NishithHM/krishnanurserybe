const Customer = require('../models/customer.model');
const Category = require('../models/categories.model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const { handleMongoError } = require('../utils');
const loggers = require('../../loggers');
const { default: axios } = require('axios');

exports.customerRegister = async (req, res) => {
  const { name, phoneNumber, dob, categoryList } = req.body;
  const interestedCategories = categoryList.map(function (val) {
    return {
      _id: val.id,
      names: {
        en: {
          name: val.categoryNameInEnglish
        },
        ka: {
          name: val.categoryNameInKannada
        }
      }
    }
  })
  try {
    const objIds = interestedCategories.map(function (val) { return new mongoose.mongo.ObjectId((val._id)); });
    const idMatchedInDBCount = await Category.find({ _id: { $in: objIds } }).count();
    // checking for invalid ID's 
    if (objIds.length != idMatchedInDBCount) {
      res.status(403).send("Forbidden Operation");
    } else {
      const customer = new Customer({ name, phoneNumber, dob : dayjs(dob, 'YYYY-MM-DD').toDate(), interestedCategories, type: 'REGULAR' })
      await customer.save();
      res.status(201).json({ customer })
    }
  } catch (error) {
    console.log(error);
    loggers.info(`customerRegister-error, ${error}`)
    const err = handleMongoError(error)
    res.status(400).send(err)
  }
};

exports.getCustomerByNumber = async (req, res)=>{
    const {phoneNumber} = req.body
    try { 
        const pipeline = [
          {
            $match:
              /**
               * query: The query in MQL.
               */
              {
                phoneNumber: parseInt(phoneNumber, 10),
              },
          },
          {
            $lookup:
              /**
               * from: The target collection.
               * localField: The local join field.
               * foreignField: The target join field.
               * as: The name for the results.
               * pipeline: Optional pipeline to run on the foreign collection.
               * let: Optional variables to use in the pipeline field stages.
               */
              {
                from: "billing_histories",
                let: {
                  id: "$_id",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ["$customerId", "$$id"],
                          },
                          {
                            $eq: ["$status", "BILLED"],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $sort: {
                      billedDate: -1,
                    },
                  },
                  {
                    $limit: 20,
                  },
                ],
                as: "billingHistory",
              },
          },
        ]
        const customer = await Customer.aggregate(pipeline)
        res.status(200).send(customer[0])
        
    } catch (error) {
        console.log(error)
        loggers.info(`getCustomerByNumber-error, ${error}`)
        const err = handleMongoError(error)
        res.status(400).send(err)
    }
   
}


exports.registerBusinessCustomer = async(req, res)=>{
  const { 
    name, 
    phoneNumber, 
    dob, 
    categoryList,
    businessName,
    customerAddressLine1,
    customerAddressLine2,
    customerAddressPinCode,
    customerAddressPinCodeDetails,
    gstNumber,
    shippingAddressLine1,
    shippingAddressLine2,
    shippingAddressPinCode,
    shippingAddressPinCodeDetails,
    latitude,
    longitude,
   } = req.body; 
   const interestedCategories = categoryList.map(function (val) {
    return {
      _id: val.id,
      names: {
        en: {
          name: val.categoryNameInEnglish
        },
        ka: {
          name: val.categoryNameInKannada
        }
      }
    }
  })
   const objIds = interestedCategories.map(function (val) { return new mongoose.mongo.ObjectId((val._id)); });
   const idMatchedInDBCount = await Category.count({ _id: { $in: objIds } });
   console.log(objIds, idMatchedInDBCount)
   // checking for invalid ID's 
   if (objIds.length != idMatchedInDBCount) {
    res.status(403).send("Forbidden Operation");
  } else {
    const customer = new Customer(
      { 
        name,
        phoneNumber, 
        dob : dayjs(dob, 'YYYY-MM-DD').toDate(), 
        interestedCategories, 
        gst: gstNumber, 
        businessName, 
        address:`${customerAddressLine1}, ${customerAddressLine2}, ${customerAddressPinCodeDetails}, ${customerAddressPinCode}`,
        shippingAddress:`${shippingAddressLine1}, ${shippingAddressLine2}, ${shippingAddressPinCodeDetails}, ${shippingAddressPinCode}`,
        location:{latitude, longitude},
        type:'BUSINESS'
      })
    await customer.save();
    res.status(201).json({ customer })
  }
}


exports.getCustomersList = async (req, res)=>{
  const {pageNumber=1, search, type, isCount} = req.body
  const pipeline = []
  const matchExpr = {}
  if(type){
    matchExpr.type = type
  }
  if(search){
    matchExpr.name  = {$regex:search,  $options: "i" }
  }
  const SIZE = 10
  const skip = {
    $skip : SIZE * (pageNumber-1)
  }
  const limit ={
    $limit: SIZE
  }
  const match = {$match:matchExpr}
  if(isCount){
    const count = {
      $count: 'count'
    }
    pipeline.push(...[match, count])
  }else{
   pipeline.push(...[match, limit, skip])

  }
  console.log("getBusinessCustomers-pipeline", JSON.stringify(pipeline));
  const customers = await Customer.aggregate(pipeline);
  loggers.info(`getBusinessCustomers-pipeline, ${JSON.stringify(pipeline)}`);
  res.json(customers);
  
}


exports.getPincode = async (req, res)=>{
  const {pincode} = req.body
  const pinData = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`)
  const pincodeDetails = pinData.data
  if(pincodeDetails[0]?.Status==="Success"){
    const place= `${pincodeDetails[0]?.PostOffice?.[0]?.Name},  ${pincodeDetails[0]?.PostOffice?.[0]?.Block}, ${pincodeDetails[0]?.PostOffice?.[0]?.District}, ${pincodeDetails[0]?.PostOffice?.[0]?.State} `
    res.json({place})
  }else{
    res.json({place:''})
  }
}

