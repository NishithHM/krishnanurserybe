const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProcurementSchema = new Schema({
    nameForCustomer: { type: String, required: true }, 
    sellingPrice: { type: Number, required: true },    
});

module.exports = mongoose.model('Procurement', ProcurementSchema);
