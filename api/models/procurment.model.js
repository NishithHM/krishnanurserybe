const mongoose = require('mongoose')
const arrayLimit=(val)=> {
    return val.length <= 10;
  }
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
                required: true
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
    totalQuantity: {
        type: Number,
        default: 0,
        required: true
    },
    remainingQuantity: {
        type: Number,
        default: 0,
        required: true
    },
    lastProcuredOn: {
        type: Date,
        required: true
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
    procurementHistory: {
        type: [{
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
            procuredOn: {
                type: Date,
                required: true
            },
            description:{
                type: String
            },
            vendorName:{
                type: String,
                required: true
            },
            vendorContact:{
                type: String,
                required: true
            },
            vendorId:{
                type: String,
                required: true
            },
            invoice: {
                type: String,
                required:  true,
            }
        }],
        validate: [arrayLimit, '{PATH} exceeds the limit of 10']
    }
}, {
    timestamps: true
})



// userSchema.methods.comparePassword = function (password) {
//     return bcrypt.compareSync(password, this.hash_password)
// }

// userSchema.methods.toJSON = function () {
//     const user = this
//     const userObj = user.toObject()
//     delete userObj.hash_password
//     return userObj;
// }

module.exports = mongoose.model("procurements", Procurement)