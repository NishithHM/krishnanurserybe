const { mongo } = require("mongoose")
const Procurement = require('../models/procurment.model')
const Section = require('../models/sections.model')
const plant_infoModel = require("../models/plant_info.model")
const { convertCoverImagesToPresignedUrls } = require("./plant_info.controller")
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

exports.getSections = async (req, res) => {
  try {
    // Get sections sorted by stack
    const sections = await Section.find().sort({ stack: 1 }).lean()

    // Lookup plant info for each section, limiting to 5 plants
    const sectionsWithPlants = await Promise.all(sections.map(async (section) => {
      const plantIds = section.plants.map(plant => plant._id)
      console.log(plantIds)
      const plants = await plant_infoModel.find({ procurementId: { $in: plantIds } })
        .limit(7)
        .lean()

      const plantsWithPresignedUrls = await Promise.all(plants.map(async (plant) => {
        const coverImages = await convertCoverImagesToPresignedUrls(plant.coverImages)
        return { ...plant, coverImages }
      }))

      return {
        ...section,
        plants: plantsWithPresignedUrls
      }

    }))

    res.status(200).json(sectionsWithPlants)
  } catch (error) {
    console.error('Error getting sections:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

exports.getPlantsFromSection = async (req, res) => {
  try {
    const { page = 1, limit = 10, id} = req.body

    const section = await Section.findById(id).lean()

    if (!section) {
      return res.status(404).json({ message: 'Section not found' })
    }

    const plantIds = section.plants.map(plant => plant._id)
    const skip = (page - 1) * limit

    const plants = await plant_infoModel.find({ procurementId: { $in: plantIds } })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    const plantsWithPresignedUrls = await Promise.all(plants.map(async (plant) => {
      const coverImages = await convertCoverImagesToPresignedUrls(plant.coverImages)
      return { 
        ...plant, 
        coverImages,
        sectionName: section?.name
      }
    }))

    const totalPlants = await plant_infoModel.countDocuments({ procurementId: { $in: plantIds } })
    const totalPages = Math.ceil(totalPlants / limit)

    res.status(200).json({
      plants: plantsWithPresignedUrls,
      currentPage: Number(page),
      totalPages,
      totalPlants
    })
  } catch (error) {
    console.error('Error getting plants from section:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

