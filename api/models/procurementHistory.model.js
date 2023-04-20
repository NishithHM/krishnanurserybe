const mongoose = require('mongoose')
const ProcurementHistory = new mongoose.Schema({
    procurementId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    names: {
        en: {
            name: {
                type: String,
                required: true,
            }
        },
        ka: {
            name: {
                type: String,
            }
        }
    },
    requestedBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        }
    },
    placedBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        }
    },
    requestedQuantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    currentPaidAmount: {
        type: Number,
        default: 0
    },
    vendorName:{
        type: String,
        default: ''
    },
    vendorContact:{
        type: String,
        default: ''
    },
    descriptionSales:{
        type: String,
        default: ''
    },
    descriptionProc:{
        type: String
    },
    vendorId:{
        type: String,
    },
    invoice:{
        type: String,
        default: ''
    },
    status:{
        type: String,
        enum: ['REQUESTED', 'PLACED', 'VERIFIED', 'REJECTED']
    },
    quantity: {
        type: Number,
        default: 0
    },
    orderedQuantity: {
        type: Number,
        default: 0
    },
    expectedDeliveryDate:{
        type: Date
    },
    images: [{ type: String}]
}, {
    timestamps: true
})


module.exports = mongoose.model("procurement_history", ProcurementHistory)