const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const vendors = new mongoose.Schema({
	name: {
        type: String,
        required: true,
    },
   contact:{
        type: String,
        required: true,
        unique: true,
   },
   isDefault: {
        type: Boolean,
        default: false
   },
   deviation: {
    type: Number,
    default: 0
   },
   type:{
    type: String,
    require: true
   }
}, {
	timestamps: true
})

vendors.index({'contact': 1}, {unique: true})

vendors.on('index', function(err) {
    if (err) {
        console.error('vendors index error: %s', err);
    } else {
        console.info('vendors indexing complete');
    }
});
const vendorModel = mongoose.model("vendors", vendors)

const createDefaults = async ()=>{
    try{
        const krishaVendor = await vendorModel.findOne({contact:'9999999999'})
        if(!krishaVendor){
            const defaultVendor = new vendorModel({name:'Sri Krishna Nursery', contact:'9999999999', isDefault: true})
            defaultVendor.save()
        }
    }catch(e){
        console.log('err')
    }
}

createDefaults()

module.exports = vendorModel