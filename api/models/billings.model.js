const mongoose = require('mongoose')
const BillingHistory = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    customerName: {
        type: String,
        required: [true, 'Name is required'],
        lowercase: true,
    },
    customerNumber: {
        type: Number,
        required: true,
        validate: {
            validator: (val) => val.toString().length === 10,
            message: (props) => {
                return `${props.value} is not 10 digit long`
            }
        }
    },
    items: {
        type: [{
            procurementId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            procurementName: {
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
            variant: {
                type: mongoose.Schema.Types.Mixed,
            },
            quantity: {
                type: Number,
                required: true,
            },
            mrp: {
                type: Number, 	// saving this bcz, admin might increase/decrease price later
                required: true,
            },
            rate: {
                type: Number,
                required: true,
            },
            type: {
                type: String,
            },
            typeName: {
                type: String,
            }
        }],
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0
    },
    roundOff: {
        type: Number,
        default: 0
    },
    soldBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    billedBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        },
        required: false
    },
    status: {
        type: String,
        required: true
    },
    invoiceId: {
        type: String,
        default: ''
    },
    type:{
        type: String,
        enum: ['AGRI', 'NURSERY']
    },
    billedDate: {
        type: Date,
        default: ''
    },
}, {
    timestamps: true
})

module.exports = mongoose.model("billing_history", BillingHistory)