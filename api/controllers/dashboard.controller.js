const dayjs = require("dayjs")
const metaDataModel = require("../models/metaData.model")
const procurmentModel = require("../models/procurment.model")
const { default: mongoose } = require("mongoose")
const _ = require('lodash')
const vendorModel = require("../models/vendor.model")
exports.dahboardMetaData = async (req, res) => {
  const { startDate, endDate, categories, plants, mode="plants" } = req.body
  const sDateDjs = dayjs(startDate, 'YYYY-MM-DD').startOf('day')
  const eDateDjs = dayjs(endDate, 'YYYY-MM-DD').endOf('day') 
  const sDate = sDateDjs.toDate()
  const eDate = eDateDjs.toDate()
  const daysDiff = eDateDjs.diff(sDateDjs, 'days')
  const sDateForGraph = sDateDjs.subtract(daysDiff, 'days').startOf('day').format('YYYY-MM-DD')
  const eDateForGraph = eDateDjs.subtract(daysDiff, 'days').endOf('day').format('YYYY-MM-DD')
  let plantIds = [], categoryIds = []
  const otherMetaMatch = {}, otherProcMatch = {}
  if (plants?.length) {
    plantIds = plants.map(ele => mongoose.mongo.ObjectId(ele))
    otherMetaMatch.procurementId = { $in: plantIds }
    otherProcMatch._id = { $in: plantIds }
  } else if (categories?.length) {
    categoryIds = categories.map(ele => ele)
    otherMetaMatch["categories._id"] = { $in: categoryIds }
    otherProcMatch["categories._id"] = { $in: categoryIds }
  }

  const pipelineMeta = [
    {
      $match: {
        date: { $gte: sDate, $lt: eDate },
        type: "NURSERY",
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
        type: "NURSERY",
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
        names: {
          $first: "$names",
        },
        underMaintenanceQuantity: {
          $last: "$underMaintenanceQuantity",
        },
        remainingQuantity: {
          $last: "$remainingQuantity",
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
        type: "NURSERY",
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
        _id: "$bill_data._id.en.name",
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
  console.log(JSON.stringify(pipelineMeta), "pipelineMeta")
  const pipelinePayments = [
    {
      $match: {
        date: { $gte: sDate, $lt: eDate },
        type: "PAYMENT",
        ...otherMetaMatch
      },
    },
    {
      $group: {
        _id: "$paymentType",
        payments: {
          $sum: "$amount",
        },
        cashAmount: {
          $sum: "$cashAmount"
        },
        onlineAmount: {
          $sum: "$onlineAmount"
        }
      },
    },
    {
      $group: {
        _id: null,
        values: {
          $push: {
            k: "$_id",
            v: {
              payments: "$payments",
              cashAmount: "$cashAmount",
              onlineAmount: "$onlineAmount"
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        paymentSummary: {
          $arrayToObject: "$values"
        }
      }
    },
    {
      $replaceRoot:
      /**
       * replacementDocument: A document or string.
       */
      {
        newRoot: "$paymentSummary"
      }
    }
  ]
  const quantityPipeline = [
    {
      $match: {
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
  console.log('pipeline-payments', JSON.stringify(pipelinePayments))

  const vendorPipeline = [
    {
      $match: {
        type: "NURSERY",
      },
    },
    {
      $group:
      /**
       * _id: The id of the group.
       * fieldN: The first field name.
       */
      {
        _id: null,
        deviation: {
          $sum: "$deviation",
        },
      },
    },
  ]

  const metaData = await metaDataModel.aggregate(pipelineMeta)
  const plantsData = await metaDataModel.aggregate(pipelinePlants)
  const metaPayments = await metaDataModel.aggregate(pipelinePayments)
  const vendors = await vendorModel.aggregate(vendorPipeline)
  const roundOffPipeline = [
    {
      $match: {
        date: { $gte: sDate, $lt: eDate },
        type: "ROUNDOFF",
        ...otherMetaMatch
      },
    },
    {
      $group:
      /**
       * _id: The id of the group.
       * fieldN: The first field name.
       */
      {
        _id: null,
        roundOff: {
          $sum: "$totalRoundOff",
        },
        cashAmount: {
          $sum: "$totalCashAmount"
        },
        onlineAmount: {
          $sum: "$totalOnlineAmount"
        }
      },
    },
  ]
  let variants = []
  if (plantIds?.length === 1) {
    console.log('pipeline-variants', JSON.stringify(pipelineVairants))
    variants = await metaDataModel.aggregate(pipelineVairants)

  }
  let roundOffs = []
  if (plantIds?.length === 0 && categoryIds.length === 0) {
    console.log('pipeline-round', JSON.stringify(roundOffPipeline))
    roundOffs = await metaDataModel.aggregate(roundOffPipeline)
  }
  console.log(JSON.stringify(roundOffPipeline))
  const quantity = await procurmentModel.aggregate(quantityPipeline)
  console.log(variants, 'variants')

  const timeDataPrev = await caluclateGraphs(sDateForGraph, eDateForGraph, categories, plants, mode)
  const timeDataCurrent = await caluclateGraphs(startDate, endDate, categories, plants, mode)

  console.log('time_data', timeDataPrev, timeDataCurrent)
  const percentages = caluclatePercentagesAll(timeDataPrev, timeDataCurrent)
  console.log('percentages', percentages)

  let payments = { payments: 0 }
  let vendorDevaition = { deviation: 0 }
  if (plantIds.length === 0) {
    vendorDevaition = vendors[0]
  }
  if (!_.isEmpty(metaPayments)) {
    payments = metaPayments[0]
    console.log(payments, 'payments', payments.VENDOR)
    payments.TOTAL = {
      payments: payments?.VENDOR?.payments + payments?.SALARY?.payments + payments?.OTHERS?.payments,
      cashAmount: payments?.VENDOR?.cashAmount + payments?.SALARY?.cashAmount + payments?.OTHERS?.cashAmount,
      onlineAmount: payments?.VENDOR?.onlineAmount + payments?.SALARY?.onlineAmount + payments?.OTHERS?.onlineAmount
    }
  }
  const resp = { ...metaData[0], ...payments, ...quantity[0], ...roundOffs[0], plants: plantsData, variants, ...percentages }
  resp.sales = resp.sales - _.get(resp, "roundOff", 0)
  if(mode==="payments"){
    resp.profit = resp.sales - resp?.TOTAL?.payments
  }else{
    resp.profit = resp.sales - resp.investment
  }
  resp.inventory = resp.underMaintenanceQuantity + resp.remainingQuantity

  console.log(resp.investment, 'resp', vendorDevaition.deviation)

  resp.investment = resp.investment;
  resp.vendorDeviation = vendorDevaition.deviation;
  // console.log(resp)

  res.json(resp)
}

exports.dahboardMetaGraph = async (req, res) => {
  const { startDate, endDate, categories, plants } = req.body
  const data = await caluclateGraphs(startDate, endDate, categories, plants)
  res.json(data)
}

const caluclateGraphs = async (startDate, endDate, categories, plants, mode) => {
  const sDate = dayjs(startDate, 'YYYY-MM').startOf('month').toDate()
  const eDate = dayjs(endDate, 'YYYY-MM').endOf('month').toDate()
  let plantIds = [], categoryIds = []
  const otherMetaMatch = {}
  if (plants?.length) {
    plantIds = plants.map(ele => mongoose.mongo.ObjectId(ele))
    otherMetaMatch.procurementId = { $in: plantIds }
  } else if (categories?.length) {
    categoryIds = categories.map(ele => mongoose.mongo.ObjectId(ele))
    otherMetaMatch["categories._id"] = { $in: categoryIds }
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
        sales: {
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
        roundOff: {
          $sum: "$totalRoundOff"
        },
        wastages: {
          $sum: "$damages"
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
          $subtract: plantIds.length === 0 && categoryIds.length === 0 ? [{ $subtract: ["$sales", "$roundOff"] }, "$investment"] : ["$sales", "$investment"],
        },
        sales: {
          $subtract: plantIds.length === 0 && categoryIds.length === 0 ? ["$sales", "$roundOff"] : ["$sales", 0],
        },
        inventory: {
          $add: ["$underMaintenanceQuantity", "$remainingQuantity"]
        },
        vendorAmount: 0,
        salaryAmount: 0,
        othersAmount: 0,
        vendorCashAmount: 0,
        salaryCashAmount: 0,
        othersCashAmount: 0,
        vendorOnlineAmount: 0,
        salaryOnlineAmount: 0,
        othersOnlineAmount: 0
      },

    },
  ]

  const paymentsPipeline = [
    {
      $match: {
        date: { $gte: sDate, $lt: eDate },
        type: "PAYMENT"
      }
    },
    {
      $sort: {
        date: 1
      }
    },
    {
      $group: {
        _id: {
          year: {
            $year: "$date"
          },
          month: {
            $month: "$date"
          },
          paymentType: "$paymentType"
        },
        payments: {
          $sum: "$amount"
        },
        cashAmount: {
          $sum: "$cashAmount"
        },
        onlineAmount: {
          $sum: "$onlineAmount"
        }
      }
    },
    {
      $addFields: {
        month: {
          $concat: [
            {
              $toString: "$_id.year"
            },
            "/",
            {
              $toString: "$_id.month"
            }
          ]
        },
        paymentType: "$_id.paymentType",
        "_id.paymentType": 0

      }
    },
    {
      $group:
      /**
       * _id: The id of the group.
       * fieldN: The first field name.
       */
      {
        _id: "$_id",
        data: {
          $push: "$$ROOT"
        }
      }
    }
  ]

  console.log(JSON.stringify(pipeline), 'graphs')

  const metaData = await metaDataModel.aggregate(pipeline)
  const paymentData = await metaDataModel.aggregate(paymentsPipeline)
  const newData = _.cloneDeep(metaData)

  paymentData.forEach(ele => {
    const { year, month } = ele._id
    const monthStr = `${year}/${month}`

    const ind = newData.findIndex(ele => ele.month === monthStr)
    const updaData = {}
    ele.data.forEach(data => {
      if (data.paymentType === "VENDOR") {
        updaData.vendorAmount = data.payments
        updaData.vendorCashAmount = data.cashAmount
        updaData.vendorOnlineAmount = data.onlineAmount
      } else if (data.paymentType === "SALARY") {
        updaData.salaryAmount = data.payments
        updaData.salaryCashAmount = data.cashAmount
        updaData.salaryOnlineAmount = data.onlineAmount
      } else if (data.paymentType === "OTHERS") {
        updaData.othersAmount = data.payments
        updaData.othersCashAmount = data.cashAmount
        updaData.othersOnlineAmount = data.onlineAmount
      }
      if(mode==="payments"){
        updaData.profit = newData[ind].sales - updaData.vendorAmount - updaData.salaryAmount - updaData.othersAmount
      }
    })
    if (ind !== -1) {

      newData[ind] = {
        ...newData[ind],
        ...updaData
      }
    }
  })
  return fillMonths(newData, startDate, endDate)

}

const fillMonths = (metaData, startDate, endDate) => {
  const monhts = []
  let sDate = dayjs(startDate, 'YYYY-MM').startOf('month')
  const eDate = dayjs(endDate, 'YYYY-MM').endOf('month')
  while (eDate.toDate() > sDate.toDate()) {
    monhts.push(sDate.format('YYYY/M'))
    sDate = sDate.add(1, 'month')
  }
  const initVal = {
    "payments": 0,
    "sales": 0,
    "saleQuantity": 0,
    "remainingQuantity": 0,
    "underMaintenanceQuantity": 0,
    "investment": 0,
    "roundOff": 0,
    "profit": 0,
    "inventory": 0,
    "wastages": 0,
    "vendorAmount": 0,
    "salaryAmount": 0,
    "othersAmount": 0,
    "vendorCashAmount": 0,
    "salaryCashAmount": 0,
    "othersCashAmount": 0,
    "vendorOnlineAmount": 0,
    "salaryOnlineAmount": 0,
    "othersOnlineAmount": 0
  }
  const finalMeta = monhts.map(ele => {
    const month = metaData.filter(data => data.month === ele)
    if (_.isEmpty(month)) {
      return { ...initVal, month: ele }
    } else {
      return month[0]
    }
  })
  return finalMeta;
}


const caluclatePercentagesAll = (dataPrev, dataCurrent) => {
  const keys = ['payments', 'sales', 'saleQuantity', 'investment', 'profit', 'wastages', 'vendorAmount', 'salaryAmount', 'othersAmount', 'vendorCashAmount', 'salaryCashAmount', 'othersCashAmount', 'vendorOnlineAmount', 'salaryOnlineAmount', 'othersOnlineAmount']
  const percentages = {}
  keys.map(ele => {
    const percentage = caluclatePercentageEach(dataPrev, dataCurrent, ele)
    percentages[ele + '_perecntage'] = percentage
  })
  return percentages

}

const caluclatePercentageEach = (dataPrev, dataCurrent, key) => {
  let valuesPrev = dataPrev.reduce((acc, val) => acc + val[key], 0)
  let valuesCurrent = dataCurrent.reduce((acc, val) => acc + val[key], 0)
  valuesPrev = valuesPrev - valuesCurrent
  console.log(key, valuesCurrent, valuesPrev, 'percentage')
  const percentage = ((valuesCurrent - valuesPrev) * 100) / Math.abs(valuesPrev)
  return percentage
}