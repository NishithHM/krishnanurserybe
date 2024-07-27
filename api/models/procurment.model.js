const mongoose = require('mongoose')

const Procurement = new mongoose.Schema({
    names: {
        en: {
            name: {
                type: String,
                required: true,
                unique: true
            }
        },
        ka: {
            name: {
                type: String,
            }
        },
        customer: {
            name: {
                type: String,
            }
        }
    },
    categories: {
        type:[{
            name: {
                type: String,
                lowercase: true,
            },
            _id: {
                type: String,
            }
        }],
    },
    remainingQuantity: {
        type: Number,
        default: 0,
    },
    lastProcuredOn: {
        type: Date,
    },
    minimumQuantity:{
        type: Number,
        default: 0
    },
    variants:{
        type:[{
            names:{
                en:{
                    name:{
                        type: String,
                    }
                },
                ka:{
                    name:{
                        type: String
                    }
                }
            },
            minPrice:{
                type: Number
            },
            maxPrice:{
                type: Number
            }
        }]
    },
    underMaintenanceQuantity: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true
})

module.exports = mongoose.model("procurements", Procurement)