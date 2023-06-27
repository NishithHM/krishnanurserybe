const mongoose = require('mongoose')
const AgriOptions = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    options:[{
        type: String,
        lowercase: true
    }],
},{
    timestamps: true
})

module.exports = mongoose.model("agri_options", AgriOptions);