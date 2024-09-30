
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true }, 
  isValid: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiryDate: { type: Date } 
});

CouponSchema.methods.isExpired = function () {
  return this.expiryDate && this.expiryDate < new Date();
};

module.exports = mongoose.model('Coupon', CouponSchema);
