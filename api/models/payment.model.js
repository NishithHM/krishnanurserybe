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
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("payments", payments)