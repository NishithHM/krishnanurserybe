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
    createdBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        },
    },
},{
    timestamps: true
})

module.exports = mongoose.model("agri_vairants", AgriVariants);