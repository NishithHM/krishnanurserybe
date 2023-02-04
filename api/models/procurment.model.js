const mongoose = require('mongoose')
const arrayLimit=(val)=> {
    return val.length <= 20;
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