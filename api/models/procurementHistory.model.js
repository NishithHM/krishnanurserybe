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
                required: true
            }
        }
    },

    createdBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        }
    },
    quantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    vendorName:{
        type: String,
        required: true
    },
    vendorContact:{
        type: String,
        required: true
    },
    description:{
        type: String
    },
    vendorId:{
        type: String,
        required: true
    },
    invoice:{
        type: String,
        required: true,
    },
    images: [{ type: String}]
}, {
    timestamps: true
})


module.exports = mongoose.model("procurement_history", ProcurementHistory)