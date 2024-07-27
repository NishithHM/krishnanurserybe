const { default: mongoose } = require('mongoose')
const PlantInfo = require('../models/plant_info.model')
const procurmentModel = require('../models/procurment.model')
const Tag = require('../models/tags.model')
const uuid = require('uuid')
const path = require('path')
const fs = require('fs')
const { uploadFile, getPresignedUrl } = require('../utils')


const addPlantInfo = async (req, res) => {
    try {
        // Validate the request body
        const value = req.body


        const coverS3s =  await Promise.all(value.coverImages.map(async (base64Image) => {
            const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
            const type = base64Image.split(';')[0].split('/')[1]
            const fileName = `plants_${uuid.v4()}.${type}`
            const tempFilePath = path.join(__dirname, `../uploads/${fileName}`)
            await fs.promises.writeFile(tempFilePath, buffer)
            await uploadFile({
                file: { path: tempFilePath },
                path: 'customer/plants',
                key: fileName
              })
            return `customer/plants/${fileName}`
        }))
        
        const sectionS3s =  await Promise.all(value.sections.map(async ({image}) => {
            const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
            const type = image.split(';')[0].split('/')[1]
            const fileName = `sections${uuid.v4()}.${type}`
            const tempFilePath = path.join(__dirname, `../uploads/${fileName}`)
            await fs.promises.writeFile(tempFilePath, buffer)
            await uploadFile({
                file: { path: tempFilePath },
                path: 'customer/sections',
                key: fileName
              })
            return `customer/sections/${fileName}`
        }))

        const sections = []
        for(let i=0; i<value.sections; i++){
            sections.push({text: value.sections[i]?.text, image: sectionS3s[i]})
        }
    

        // Add tags to the tags collection if they don't exist
        const tagPromises = value.tags.map(async (tagName) => {
            if(!mongoose.Types.ObjectId.isValid(tagName)){
                const newTag = new Tag({ name: tagName })
                return newTag.save()
            }
            return tagName
        })
        await Promise.all(tagPromises)
        
        // Convert value.tags string array to mongo _id object array
        const convertedTags = await Promise.all(value.tags.map(async (tag) => {
            if (mongoose.Types.ObjectId.isValid(tag)) {
                return mongoose.Types.ObjectId(tag)
            } else {
                return null;
            }
        }))


        // Get tags which match value.tags
        const matchedTags = await Tag.find({
            $or: [
                { _id: { $in: convertedTags } },
                { name: { $in: value.tags } }
            ]
        })


        // Create a new plant info document
        const procurement = await procurmentModel.findById(value.procurementId)
        procurement.names.customer = {name: value.nameForCustomer }
        await procurement.save()
        const newPlantInfo = new PlantInfo({
            procurementId: value.procurementId,
            names: procurement.names, // Assuming names are provided in the request
            sellingPrice: value.sellingPrice,
            discountedSellingPrice: value.discountedSellingPrice,
            coverImages: coverS3s,
            tips: value.tips,
            moreInfo: value.moreInfo,
            tags: matchedTags,
            sections: sections,
            status: value.status || 'DRAFT',
            isActive: true
        })

        // Save the new plant info to the database
        const savedPlantInfo = await newPlantInfo.save()

        res.status(201).json({
            message: 'Plant info added successfully',
            data: savedPlantInfo
        })

    } catch (error) {
        console.error('Error adding plant info:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

const getPlantInfoByProcurementId = async (req, res) => {
    try {
        const { id } = req.params

        // Find plant info by procurementId
        const plantInfo = await PlantInfo.findOne({ procurementId: id })
        plantInfo.coverImages = await convertCoverImagesToPresignedUrls(plantInfo.coverImages)
        plantInfo.sections = await convertSectionImagesToPresignedUrls(plantInfo.sections)
        if (!plantInfo) {
            return res.status(404).json({ message: 'Plant info not found' })
        }

        res.status(200).json({
            message: 'Plant info retrieved successfully',
            data: plantInfo
        })
    } catch (error) {
        console.error('Error getting plant info:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}




const convertCoverImagesToPresignedUrls = async (coverImages) => {
    if (coverImages && coverImages.length > 0) {
        const presignedUrls = await Promise.all(
            coverImages.map(async (imagePath) => {
                const presignedUrl = await getPresignedUrl(imagePath)
                return presignedUrl 
            })
        )
        return presignedUrls

    }
    return []
}

const convertSectionImagesToPresignedUrls = async (sections) => {
    if (sections && sections.length > 0) {
        const updatedSections = await Promise.all(
            sections.map(async (section) => {
                let presignedUrl 
                if (section.image) {
                     presignedUrl = await getPresignedUrl(section?.image)
                }

               return { ...section, image: presignedUrl }
            })
        )
        return updatedSections;
    }
    return []
}




module.exports = { addPlantInfo,  getPlantInfoByProcurementId}
