const mongoose = require('mongoose')
const payments = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    contact: {
        type: String,
    },
    invoiceId: {
        type: String,
    },
    amount: {
        type: Number,
    },
    type:{
        type: String,
        enum: ['BROKER', 'SALARY', 'OTHERS']
    },
    brokerId:{
        type: String,
        default: null
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("payments", payments)