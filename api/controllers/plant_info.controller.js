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
        for(let i=0; i<value.sections.length; i++){
            sections.push({image: sectionS3s[i], text: value.sections[i]?.text})
        }

        console.log(sections)

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
        const role = req?.token?.role;
        // Find plant info by procurementId
        const plantInfo = await PlantInfo.findOne({ procurementId: id, status: role==='admin' ? 'PUBLISHED' : {$ne: ""}})
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

const getPlantInfoList = async (req, res) => {
    try {
        
        const { search, pageNumber = 1, tags, type, limit=10 } = req.body
        const role = req?.token?.role;
        const skip = (pageNumber - 1) * limit

        let query = {}

        if (search) {
            query.$or = [
                { 'names.customer.name': { $regex: search, $options: 'i' } },
                { 'names.en.name': { $regex: search, $options: 'i' } }
            ]
        }

        if (tags && tags.length > 0) {
            query["tags._id"] = { $in: tags }
        }

        if(role==='amdin'){
            query.status = role!=='admin' ? 'PUBLISHED' : {$ne: ""}
        }

        const totalCount = await PlantInfo.countDocuments(query)
        const plantInfoList = await PlantInfo.find(query)
            .skip(skip)
            .limit(limit)
            .lean()
        let infoResult = plantInfoList

        if (type !== 'search') {
            infoResult = await Promise.all(
                plantInfoList.map(async (plantInfo) => {
                    const coverImages = await convertCoverImagesToPresignedUrls(plantInfo.coverImages)
                    const sections = await convertSectionImagesToPresignedUrls(plantInfo.sections)
                    return { ...plantInfo, coverImages, sections }
                })
            )
        }

        res.status(200).json({
            plantInfoList: infoResult,
            totalCount,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalCount / limit)
        })
    } catch (error) {
        console.error('Error in getPlantInfoList:', error)
        res.status(500).json({ error: 'Internal server error' })
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

const publishPlantInfo = async (req, res) => {
    try {
        const { id } = req.body;

        // Find the plant info by ID
        const plantInfo = await PlantInfo.findOne({procurementId:id})

        if (!plantInfo) {
            return res.status(404).json({ message: 'Plant info not found' });
        }

        // Update the status to 'PUBLISH'
        plantInfo.status = 'PUBLISH';

        // Save the updated plant info
        const updatedPlantInfo = await plantInfo.save();


        res.status(200).json({
            message: 'Plant info published successfully',
            data: updatedPlantInfo
        });
    } catch (error) {
        console.error('Error publishing plant info:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = { addPlantInfo,  getPlantInfoByProcurementId, getPlantInfoList, convertCoverImagesToPresignedUrls, convertSectionImagesToPresignedUrls, publishPlantInfo}
