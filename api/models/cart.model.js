
const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true, 
  },
 
  items: {
    type: [
      {
        plantId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true, 
        },
        name: {
          type: Object,
          required: true, 
        },
        price: {
          type: Number,
          required: true,
        },
        discountedPrice: {
          type: Number, 
          required: true,
        },
        qty: {
          type: Number,
          required: true, 
          default: 1, 
        },
        tips: {
          type: String, 
        },
        moreInfo: {
          type: String, 
        },
        tags: {
          type: [String], 
        },
      },
    ],
    default: [], 
  },
  totalAmount: {
    type: Number,
    required: true, // Total price after discounts
  },
  totalDiscount: {
    type: Number,
    default: 0, 
  },
  offerDiscount: {
    type: Number,
    default: 0, 
  },
  couponCode: {
    type: String,
    default: null, 
  },
  status: {
    type: String,
    enum: ['placed', 'approved', 'cart'],
    default: 'cart',
  },
  extraFee:{
    type:Number,
    default:0
  },
  invoiceId:{
    type: String
  },
  customer:{
    type: Object
  }
}, {
  timestamps: true, 
});

module.exports = mongoose.model('Cart', CartSchema);
