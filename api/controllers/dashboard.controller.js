const dayjs = require("dayjs")
const metaDataModel = require("../models/metaData.model")
const procurmentModel = require("../models/procurment.model")
const { default: mongoose } = require("mongoose")

exports.dahboardMetaData = async (req, res) => {
    const { startDate, endDate, categories, plants } = req.body
    const sDate = dayjs(startDate, 'YYYY-MM').startOf('month').toDate()
    const eDate = dayjs(endDate, 'YYYY-MM').endOf('month').toDate()
    let plantIds, categoryIds
    const otherMetaMatch = {}, otherProcMatch = {}
    if(plants?.length){
       plantIds = plants.map(ele=> mongoose.mongo.ObjectId(ele))
       otherMetaMatch.procurementId= {$in:plantIds}
       otherProcMatch._id = {$in:plantIds}
    }else if(categories?.length){
        categoryIds = categories.map(ele=> mongoose.mongo.ObjectId(ele))
        otherMetaMatch["categories._id"]= {$in:categories}
        otherProcMatch["categories._id"]= {$in:categories}
    }
    
    const pipelinePlants = [
        {
            $match: {
                date: { $gte: sDate, $lt: eDate },
                type:"NURSERY",
                ...otherMetaMatch
            },
        },
        {
            $group: {
                _id: null,
                profit: {
                    $sum: "$profit",
                },
                sales: {
                    $sum: "$sales.totalSales",
                },
                investment: {
                    $sum: "$procurements.totalPrice",
                },
                damages: {
                    $sum: "$damages",
                },
            },
        },
    ]
    console.log(JSON.stringify(pipelinePlants))
    const pipelinePayments = [
        {
            $match: {
                date: { $gte: sDate, $lt: eDate },
                type:"PAYMENT",
                ...otherMetaMatch
            },
        },
        {
            $group: {
                _id: null,
                payments: {
                    $sum: "$amount",
                },
            },
        },
    ]
    const quantityPipeline = [
        {
          $match:{
             ...otherProcMatch
          }
        },
        {
          $group:
            /**
             * _id: The id of the group.
             * fieldN: The first field name.
             */
            {
              _id: null,
              remainingQuantity: {
                $sum: "$remainingQuantity",
              },
              underMaintenanceQuantity: {
                $sum: "$underMaintenanceQuantity",
              },
            },
        },
      ]
    console.log(JSON.stringify(pipelinePayments))
    const metaData = await metaDataModel.aggregate(pipelinePlants)
    const metaPayments = await metaDataModel.aggregate(pipelinePayments)
    const quantity = await procurmentModel.aggregate(quantityPipeline)
    console.log(metaData)
    const resp = {...metaData[0], ...metaPayments[0], ...quantity[0]}
    res.json(resp)
}