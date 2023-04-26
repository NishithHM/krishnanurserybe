const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
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
                variantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },
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
    }
}, {
    timestamps: true
})
customerSchema.index({'phoneNumber': 1}, {unique: true})

module.exports = mongoose.model("customer", customerSchema)