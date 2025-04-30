const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        lowercase: true,
    },
    businessName: {
        type: String,
        lowercase: true,
    },
    phoneNumber: {
        type: Number,
        required: true,
        validate: {
            validator: (val) => val.toString().length === 10,
            message: (props) => {
                return `${props.value} is not 10 digit long`
            }
        },
    },
    dob: {
        type: Date,
        required: true
    },
    address:{
        type:String
    },
    shippingAddress:{
        type:String
    },
    gst:{
        type:String
    },
    interestedCategories: {
        type: [{
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            names: {
                en: {
                    name: {
                        type: String,
                    }
                },
                ka: {
                    name: {
                        type: String,
                    }
                }
            }
        }],
        required: false
    },
    billingHistory: {
        type:[{
            items: [{
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
            }
        }],
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
            }
        },
        billedBy: {
            name: {
                type: String,
                lowercase: true,
            },
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            }
        },
        billedDate:{
            type: Date
        },
    }],
    required:false
    },
    type:{
        type:String,
        enum: ["BUSINESS", "REGULAR"],
        default: "REGULAR"
    },
    location:{
        type:{
            latitude:{
                type: Number
            },
            longitude:{
                type: Number
            }
        }
    },
    returnHistory: [
        {
            items: [{
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
                returnAmount: {
                    type: Number,
                    required: true
                }
            }],
            totalreturnAmount: {
                type: Number,
                // required: true,
                default: 0
            },
        }
    ]
}, {
    timestamps: true
})
customerSchema.index({'phoneNumber': 1}, {unique: true})
customerSchema.on('index', function(err) {
    if (err) {
        console.error('customerSchema index error: %s', err);
    } else {
        console.info('customerSchema indexing complete');
    }
});
module.exports = mongoose.model("customer", customerSchema)