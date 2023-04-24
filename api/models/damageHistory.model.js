const mongoose = require('mongoose')
const DamageHistory = new mongoose.Schema({
    procurementId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    names: {
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
    reportedBy: {
        name: {
            type: String,
            lowercase: true,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        }
    },
    damagedQuantity: {
        type: Number,
        required: true
    },
    images: [{ type: String}]
}, {
    timestamps: true
})


module.exports = mongoose.model("damage_history", DamageHistory)