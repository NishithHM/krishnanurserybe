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
    shippingAddress:{
        type: String
    },
    customerAddress:{
        type: String
    },
    customerGst:{
        type: String
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
            },
            gstAmount:{
                type:Number
            },
            rateWithGst:{
                type:Number
            },
            hsnCode:{
                type:String
            },
            gst:{
                type: Number
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
    isWholeSale: {
        type: Boolean,
        default: false
    },
    isApproved:{
        type: Boolean,
        default: false
    },
    gstAmount:{
        type:Number,
        default: 0
    },
    totalWithOutGst:{
        type:Number,
    },
    approvedBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        },
        required: false
    },
    approvedOn: {
        type: Date,
        default: null
    },
}, {
    timestamps: true
})

module.exports = mongoose.model("billing_history", BillingHistory)