
module.exports = mongoose.model('Cart', CartSchema);
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
            plantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'PlantInfo' },  // Plant info reference
            name: { type: String, required: true },  // Plant name
            price: { type: Number, required: true }, // Selling price of the plant
            discountedPrice: { type: Number, required: true }, // Discounted price if available
            qty: { type: Number, required: true },  // Quantity of the plant
            tips: [String],  // Array of tips for plant care
            moreInfo: { type: String },  // Additional plant information
            tags: [String],  // Array of tag names
        }
    ],
    totalDiscount: { type: Number, default: 0 },   // Total discount applied
    totalAmount: { type: Number, required: true }, // Final total amount after discount
    couponCode: { type: String, default: null }    // Optional coupon code
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
