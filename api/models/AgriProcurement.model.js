const mongoose = require('mongoose')

const AgriProcurment = new mongoose.Schema({
    names: {
        lowercase: true,
        type: String,
        unique: true
    },
    type: {
        type: String,
        lowercase: true
    },
    remainingQuantity: {
        type: Number,
        default: 0,
    },
    lastProcuredOn: {
        type: Date,
    },
    minPrice: {
        type: Number,
        default: 0,
    },
    maxPrice: {
        type: Number,
        default: 0,
    },
    minimumQuantity: {
        type: Number,
        default: 0,
    },
    variant:{
        type:[{
            optionName:{
                type:String,
                lowercase: true
            },
            optionValue:{
                type: String,
                lowercase: true
            }
        }]
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("agri_procurments", AgriProcurment)