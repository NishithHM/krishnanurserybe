const mongoose = require('mongoose')
const AgriVariants = new mongoose.Schema({
    type:{
        type: String,
        required: true,
        lowercase: true
    },
    name:{
        type: String,
        required: true,
        lowercase: true
    },
    isActive:{
        type: Boolean,
        required: true,
        default: true
    },
    options:{
        type:[{
            optionName:{
                type:String,
                lowercase: true
            },
            optionValues:[{
                type: String,
                lowercase: true
            }]
        }]
    },
},{
    timestamps: true
})

module.exports = mongoose.model("agri_vairants", AgriVariants);