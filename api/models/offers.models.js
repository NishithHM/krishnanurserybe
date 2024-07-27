const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    plants: [{
        _id: { type: mongoose.Schema.Types.ObjectId},
        name: Object
    }],
    ordersAbove: {
        type: Number,
        required: function() {
            return !this.minPurchaseQty
        }
    },
    percentageOff: {
        type: Number,
        required: true
    },
    upto: {
        type: Number,
        required: true
    },
    minPurchaseQty: {
        type: Number,
        required: function() {
            return !this.ordersAbove
        }
    },
    image: {
        type: String,
    },
    offerCode: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    stack: {
        type: String,
        required: true
    }
})

offerSchema.pre('save', function(next) {
    if (!this.ordersAbove && !this.minPurchaseQty) {
        return next(new Error('Either ordersAbove or minPurchaseQty must be provided'))
    }
    next()
})

const Offer = mongoose.model('Offer', offerSchema)

module.exports = Offer
