

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); 

const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
  plantId: { type: Schema.Types.ObjectId, ref: 'PlantInfo', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  qty: { type: Number, required: true },
  tips: { type: [String] }, 
  moreInfo: { type: String },
  tags: [{ type: String }]
});


const CartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [CartItemSchema],
  totalAmount: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  couponCode: { type: String },
  uuid: { type: String, unique: true, default: uuidv4 }, 
}, {
  timestamps: true 
});

module.exports = mongoose.model('Cart', CartSchema);
