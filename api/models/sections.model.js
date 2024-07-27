const mongoose = require('mongoose')

const sectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['TYPE1', 'TYPE2'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  stack: {
    type: Number,
    required: true
  },
  plants: {
    type: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      names: Object
    }],
    required: true,
  }
})



const Section = mongoose.model('section', sectionSchema)

module.exports = Section
