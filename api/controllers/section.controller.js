const { mongo } = require("mongoose")
const Procurement = require('../models/procurment.model')
const Section = require('../models/sections.model')
exports.addSection = async (req, res) => {
  try {
    const { type, name, stack, plants } = req.body
    // Get plant names from procurement model
    const plantIds = plants?.map(ele=> new mongo.ObjectId(ele))
    const plantsNames = await Procurement.find({_id:{$in:plantIds}}, {names:1, _id:1})


    // Create new section
    const newSection = new Section({
      type,
      name,
      stack,
      plants: plantsNames
    })

    // Save section to database
    const savedSection = await newSection.save()

    res.status(201).json(savedSection)
  } catch (error) {
    console.error('Error adding section:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
