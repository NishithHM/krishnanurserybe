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
    res.status(500).send(err)
  }
};

exports.getCustomerByNumber = async (req, res)=>{
    const {phoneNumber} = req.body
    try { 
        const customer = await Customer.findOne({phoneNumber: parseInt(phoneNumber, 10)})
        res.status(200).send(customer)
    } catch (error) {
        console.log(error)
        loggers.info(`getCustomerByNumber-error, ${error}`)
        const err = handleMongoError(error)
        res.status(400).send(err)
    }
   
}

