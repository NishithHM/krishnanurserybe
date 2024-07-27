const Offer = require('../models/offers.models')
const uuid = require("uuid");
const fs = require('fs');
const { handleMongoError, uploadFile, getPresignedUrl } = require('../utils')
const Procurement = require('../models/procurment.model');
const { mongo } = require('mongoose');


exports.addOffer = async (req, res) => {
  try {
    const {
      plants,
      ordersAbove,
      percentageOff,
      upto,
      minPurchaseQty,
      image,
      offerCode,
      stack
    } = req.body

    // Handle image upload to S3
    let imageUrl = ''
    if (image) {
      const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
      const type = image.split(';')[0].split('/')[1]
      const fileName = `offer_${uuid.v4()}.${type}`
      const tempFilePath = `/uploads/${fileName}`
      
      await fs.promises.writeFile(tempFilePath, buffer)
      
      const uploadResult = await uploadFile({
        file: { path: tempFilePath },
        path: 'customer/offers',
        key: fileName
      })

      if (uploadResult) {
        imageUrl = `customer/offers/${fileName}`
      }
    }
    // Get plant names from procurement model
    const plantIds = plants?.map(ele=> new mongo.ObjectId(ele))
    const plantsNames = Procurement.find({_id:{$in:plantIds}}, {names:1, _id:1})


    const newOffer = new Offer({
      plants: plantsNames,
      ordersAbove,
      percentageOff,
      upto,
      minPurchaseQty,
      image: imageUrl,
      offerCode,
      stack
    })


    const savedOffer = await newOffer.save()

    res.status(201).json({
      success: true,
      message: 'Offer added successfully',
      data: savedOffer
    })
  } catch (error) {
    const mongoError = handleMongoError(error)
    if (mongoError.error) {
      return res.status(400).json(mongoError)
    }
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message })
  }
}

const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ stack: 1 })
    const offersWithPresignedUrls = await Promise.all(offers.map(async (offer) => {
      const offerObj = offer.toObject()
      if (offerObj.image) {
        offerObj.imageUrl = await getPresignedUrl(offerObj.image)
      }
      return offerObj
    }))

    res.status(200).json({
      success: true,
      message: 'Offers retrieved successfully',
      data: offersWithPresignedUrls
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message })
  }
}

module.exports = {
  createOffer,
  getAllOffers
}



