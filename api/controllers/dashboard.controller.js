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
        otherMetaMatch["categories._id"]= {$in:categoryIds}
        otherProcMatch["categories._id"]= {$in:categoryIds}
    }
    
    const pipelineMeta = [
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
        {
            $addFields: {
              profit: {
                $subtract: ["$sales", "$investment"],
              },
            }
        }
    ]
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
              _id: "$procurementId",
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
          {
            $addFields: {
              profit: {
                $subtract: ["$sales", "$investment"],
              },
              profitPercentage: {
                $multiply: [
                  100,
                  {
                    $divide: [
                      {
                        $subtract: [
                          "$sales",
                          "$investment",
                        ],
                      },
                      {
                        $cond: {
                          if: { $eq: ["$investment", 0] },
                          then: 1,
                          else: "$investment",
                        }
                    }
                    ],
                  },
                ],
              },
            },
          },
          {
            $sort:
              /**
               * Provide any number of field/order pairs.
               */
              {
                sales: -1,
              },
          },
          {
            $limit:
              /**
               * Provide the number of documents to limit.
               */
              10,
          },
        
    ]

    const pipelineVairants = [
        {
          $match: {
            date: { $gte: sDate, $lt: eDate },
                type:"NURSERY",
                ...otherMetaMatch
          },
        },
        {
          $unwind:
            /**
             * path: Path to the array field.
             * includeArrayIndex: Optional name for index.
             * preserveNullAndEmptyArrays: Optional
             *   toggle to unwind null and empty values.
             */
            {
              path: "$bill_data",
            },
        },
        {
          $sort:
            /**
             * Provide any number of field/order pairs.
             */
            {
              "bill_data.quantity": -1,
            },
        },
        {
          $group: {
            _id: "$bill_data._id",
            quantity: {
              $sum: "$bill_data.quantity",
            },
            saleAmount: {
              $sum: "$bill_data.saleAmount",
            },
          },
        },
        {
          $limit:
            /**
             * Provide the number of documents to limit.
             */
            10,
        },
      ]
    console.log(JSON.stringify(pipelineMeta))
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
    const metaData = await metaDataModel.aggregate(pipelineMeta)
    const plantsData = await metaDataModel.aggregate(pipelinePlants)
    const metaPayments = await metaDataModel.aggregate(pipelinePayments)
    let variants =[]
    if(plantIds?.length===1){
        variants = await metaDataModel.aggregate(pipelineVairants)

    }
    const quantity = await procurmentModel.aggregate(quantityPipeline)
    console.log(metaData)
    const resp = {...metaData[0], ...metaPayments[0], ...quantity[0], plants: plantsData, variants}
    res.json(resp)
}

exports.dahboardMetaGraph = async (req, res) => {
    const { startDate, endDate, categories, plants } = req.body
    const sDate = dayjs(startDate, 'YYYY-MM').startOf('month').toDate()
    const eDate = dayjs(endDate, 'YYYY-MM').endOf('month').toDate()
    let plantIds, categoryIds
    const otherMetaMatch = {}
    if(plants?.length){
       plantIds = plants.map(ele=> mongoose.mongo.ObjectId(ele))
       otherMetaMatch.procurementId= {$in:plantIds}
    }else if(categories?.length){
        categoryIds = categories.map(ele=> mongoose.mongo.ObjectId(ele))
        otherMetaMatch["categories._id"]= {$in:categoryIds}
    }
    
    const pipeline = [
        {
          $match: {
            date: { $gte: sDate, $lt: eDate },
                ...otherMetaMatch
          },
        },
        {
          $sort:
            /**
             * Provide any number of field/order pairs.
             */
            {
              date: 1,
            },
        },
        {
          $group: {
            _id: {
              year: {
                $year: "$date",
              },
              month: {
                $month: "$date",
              },
            },
            payments: {
              $sum: "$amount",
            },
            totalSales: {
              $sum: "$sales.totalSales",
            },
            saleQuantity: {
              $sum: "$sales.totalQuantity",
            },
            remainingQuantity: {
              $last: "$remainingQuantity",
            },
            underMaintenanceQuantity: {
              $last: "$underMaintenanceQuantity",
            },
            investment: {
              $sum: "$procurements.totalPrice",
            },
          },
        },
        {
          $addFields:
            /**
             * newField: The new field name.
             * expression: The new field expression.
             */
            {
              month: {
                $concat: [
                  {
                    $toString: "$_id.year",
                  },
                  "/",
                  {
                    $toString: "$_id.month",
                  },
                ],
              },
              profit: {
                $subtract: ["$totalSales", "$investment"],
              },
            },
            
        },
      ]
    
    const metaData = await metaDataModel.aggregate(pipeline)
    
    console.log(metaData)
    res.json(metaData)
}