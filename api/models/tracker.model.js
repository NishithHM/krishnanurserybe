const mongoose = require('mongoose')
const tracker = new mongoose.Schema({
	name: {
        type: String,
        required: true,
        unique: true,
    },
   number:{
        type: Number,
        required: true,
   },
}, {
	timestamps: true
})

const Tracker = mongoose.model("tracker", tracker)
const initial = new Tracker({name:'invoiceId', number:00001})
initial.save()
module.exports = Tracker;