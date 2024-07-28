const mongoose = require('mongoose')
const Schema = mongoose.Schema

const plantInfoSchema = new Schema({
    procurementId: {
        type: Schema.Types.ObjectId,
        ref: 'Procurement',
        required: true,
        unique: true
    },
    names: {
       type: Object,
       required: true
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    discountedSellingPrice: {
        type: Number,
        required: true
    },
    coverImages: {
        type: [String],
        required: true
    },
    tips: [String],
    moreInfo: {
        type: String,
        required: true
    },
    tags: [{
        _id: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true }
    }],
    sections: [{
        image: { type: String, required: true },
        text: { type: String, required: true }
    }],
    status: {
        type: String,
        enum: ['DRAFT', 'PUBLISH'],
        required: true
    },
    isActive: {
        type: Boolean,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('plant_info', plantInfoSchema)
