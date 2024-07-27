const Customer = require('../models/customer.model');
const Category = require('../models/categories.model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const { handleMongoError } = require('../utils');
const loggers = require('../../loggers');

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
      const customer = new Customer({ name, phoneNumber, dob : dayjs(dob, 'YYYY-MM-DD').toDate(), interestedCategories })
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

