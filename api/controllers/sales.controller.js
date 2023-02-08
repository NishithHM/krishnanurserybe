const Customer = require('../models/customer.model');
const Category = require('../models/categories.model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


exports.addToCart = async (req, res) => {
  console.log(req.body);
};


//should not be less than min price , more than max price
//quantity should not be more than remaining quantity
//cross verify total
//should add sales done by
//should add billedby,billed datetime