const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartSchema = new Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
        default: () => require('crypto').randomUUID()
    },
    items: [
        {
            procurementId: { type: mongoose.Schema.Types.ObjectId, required: true },  // Refers to procurement data
            name: { type: String, required: true },  // Plant name
            price: { type: Number, required: true }, // Price of the plant
            qty: { type: Number, required: true }    // Quantity of the plant
        }
    ],
    totalDiscount: { type: Number, default: 0 },   // Total discount applied
    totalAmount: { type: Number, required: true }, // Final total amount after discount
    couponCode: { type: String, default: null }    // Optional coupon code
});

module.exports = mongoose.model('Cart', CartSchema);
