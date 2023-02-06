const Customer = require('../models/customer.model');
const Category = require('../models/categories.model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

exports.customerRegister = async (req, res) => {
  const { name, phoneNumber, dob, categoryList } = req.body;
  let interestedCategories = categoryList.map(function (val) {
    return {
      _id: val.id,
      names: {
        en: {
          name: val.CategoryNameInEnglish
        },
        ka: {
          name: val.CategoryNameInKannada
        }
      }
    }
  })
  try {
    var obj_ids = interestedCategories.map(function (val) { return new mongoose.mongo.ObjectId((val._id)); });
    const idMatchedInDBCount = await Category.find({ _id: { $in: obj_ids } }).count();
    // checking for invalid ID's 
    if (obj_ids.length != idMatchedInDBCount) {
      res.status(403).send("Forbidden Operation");
    } else {
      const customer = new Customer({ name, phoneNumber, dob, interestedCategories: interestedCategories })
      await customer.save();
      res.status(201).json({ customer })
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error)
  }
};
