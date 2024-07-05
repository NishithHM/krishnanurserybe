const cron = require('node-cron')
const fs = require('fs')
const path = require('path');
const dayjs = require('dayjs');
const loggers = require('../loggers');
const Procurment = require('../api/models/procurment.model');
const MetaData = require('../api/models/metaData.model');
const { default: mongoose } = require('mongoose');
const paymentModel = require('../api/models/payment.model');
const billingsModel = require('../api/models/billings.model');
exports.dailyCron = () => {
  cron.schedule("0 0 * * *", () => {
    deleteLoggers()
    console.log('running')
    this.caluclateMetaData(dayjs().startOf('day').toDate())
  })
}

const deleteLoggers = async () => {
  fs.readdir(path.join(__dirname, '../loggers'), (err, files) => {
    console.log(err)
    files.forEach(ele => {
      console.log(ele)
      const pathVal = path.join(__dirname, `../loggers/${ele}`)
      if (ele.includes('application')) {
        fs.stat(pathVal, (err, stat) => {
          console.log(err)
          console.log(stat, ele)
          if (stat) {
            const now = new Date().getTime();
            const endTime = new Date(stat.mtime).getTime() + 86400000 * 7 * 1
            if (now > endTime) {
              fs.unlink(pathVal, (err, del) => {
                console.log(del)
              })
            }
          }
        })
      }
    })
  })
}

exports.caluclateMetaData = async (currentDate) => {
  const prevDate = dayjs(currentDate).subtract(1, 'days').startOf('day').toDate()
  
  // loggers.info('caluclating-meta-data', currentDate, prevDate)
  // console.log('caluclating-meta-data', currentDate, prevDate)
  const procurmentPipeline = [
    {
      $lookup: {
        from: "procurement_histories",
        let: {
          id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$id", "$procurementId"],
              },
              updatedAt: {
                $gte: prevDate,
                $lt: currentDate,
              },
              status: "VERIFIED",
              quantity: {
                $gt: 0,
              },
            },
          },
          {
            $group: {
              _id: "$procurementId",
              quantity: {
                $sum: "$requestedQuantity",
              },
              totalPrice: {
                $sum: "$totalPrice",
              },
            },
          },

        ],
        as: "proc_history",
      },
    },
    {
      $lookup: {
        from: "billing_histories",
        let: {
          id: "$_id",
        },
        pipeline: [
          {
            $match: {
              billedDate: {
                $gte: prevDate,
                $lt: currentDate,
              },
              status: "BILLED",
              type: "NURSERY",
            },
          },
          {
            $unwind:
            {
              path: "$items",
            },
          },
          {
            $match:
            {
              $expr: {
                $eq: [
                  "$items.procurementId",
                  "$$id",
                ],
              },
            },
          },
          {
            $group: {
              _id: "$items.variant",
              saleAmount: {
                $sum: {
                  $multiply: [
                    "$items.rate",
                    "$items.quantity",
                  ],
                },
              },
              quantity: {
                $sum: "$items.quantity",
              },
            },
          },
          {
            $project: {
              variant: "$_id",
              quantity: 1,
              saleAmount: 1,
              salePerQuantity: {
                $divide: [
                  "$saleAmount",
                  {
                    $cond: {
                      if: { $eq: ["$quantity", 0] },
                      then: 1,
                      else: "$quantity",
                    }
                  }
                ],
              },
            },
          },
        ],
        as: "bill_data",
      },
    },
    {
      $lookup: {
        from: "damage_histories",
        let: {
          id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$id", "$procurementId"],
              },
              updatedAt: {
                $gte: prevDate,
                $lt: currentDate,
              },
            },
          },
          {
            $group: {
              _id: "$procurementId",
              damages: {
                $sum: "$damagedQuantity",
              },
            },
          },
        ],
        as: "damages",
      },
    },
    {
      $project: {
        names: 1,
        remainingQuantity: 1,
        underMaintenanceQuantity: 1,
        procurements: {
          $first: "$proc_history",
        },
        damages: {
          $first: "$damages.damages",
        },
        categories:1,
        bill_data: 1,
      },
    },
    {
      $match: {
        $or: [
          {
            "bill_data.0": {
              $exists: true,
            },
          },
          {
            damages: {
              $gt: 0,
            },
          },
          {
            "procurements.quantity": {
              $exists: true,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        sales: {
          $reduce: {
            input: "$bill_data",
            initialValue: {
              totalSales: 0,
              totalQuantity: 0,
            },
            in: {
              totalSales: {
                $add: [
                  "$$value.totalSales",
                  "$$this.saleAmount",
                ],
              },
              totalQuantity: {
                $add: [
                  "$$value.totalQuantity",
                  "$$this.quantity",
                ],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        profit: {
          $subtract: [
            "$sales.totalSales",
            "$procurements.totalPrice",
          ],
        },
        type: "NURSERY",
        date: prevDate
      },
    },
    {
      $addFields: {
        profit:
        {
          $cond: {
            if: { $eq: ["$profit", null] },
            then: 0,
            else: "$profit",
          }
        },
      },
    },
  ]
  const plantData = await Procurment.aggregate(procurmentPipeline)
  // console.log(plantData.length)
  for (let i = 0; i < plantData.length; i++) {
    const dateDate = plantData[i]
    dateDate.procurementId = dateDate._id
    delete dateDate._id
    const metaData = new MetaData({ ...dateDate })
    console.log(JSON.stringify(metaData))
    await metaData.save()
    // await new Promise((res) => setTimeout(() => res(), 100))
  }
  const paymentPipeline = [
    {
      $match:{
        updatedAt: {
          $gte: prevDate,
          $lt: currentDate,
        },
      }
    },
    {
      $group:
        {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
    },
  ]
  const roundOffPipeline = [
    {
      $match:{
        billedDate: {
          $gte: prevDate,
          $lt: currentDate,
        },
        status: "BILLED"
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
          totalRoundOff: {
            $sum: "$roundOff",
          },
          totalCashAmount:{
            $sum: "$cashAmount"
          },
          totalOnlineAmount:{
            $sum: "$onlineAmount"
          }
        },
    },
  ]
  const paymentData = await paymentModel.aggregate(paymentPipeline)
  if(paymentData[0]?.amount){
    delete paymentData._id
    const metaData = new MetaData({ ...paymentData[0], type:'PAYMENT', date:prevDate})
    await metaData.save()
    // console.log(JSON.stringify(metaData))
  }
  const roundOffsData = await billingsModel.aggregate(roundOffPipeline)
  if(roundOffsData[0]?.totalRoundOff || roundOffsData[0]?.totalCashAmount || roundOffsData[0]?.totalOnlineAmount  ){
    delete roundOffsData._id
    const metaData = new MetaData({ ...roundOffsData[0], type:'ROUNDOFF', date:prevDate})
    // console.log(JSON.stringify(metaData))
    await metaData.save()
  }
}
