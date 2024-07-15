const ProcurementHistory = require("../api/models/procurementHistory.model")
const mongoose = require('mongoose')
const procurmentModel = require("../api/models/procurment.model")
const billingsModel = require("../api/models/billings.model")
const Tracker = require("../api/models/tracker.model")
const Damages = require("../api/models/damageHistory.model")
const Vendors = require("../api/models/vendor.model")

var request = require('request');
var fs = require('fs');
const dayjs = require("dayjs")
const { caluclateMetaData } = require("../crons/dailyCron")
const procurementHistoryModel = require("../api/models/procurementHistory.model")
const metaDataModel = require("../api/models/metaData.model")

const addInvoiceToProcHistory = async ()=>{
    const res = await ProcurementHistory.updateMany({}, {$set: {invoice: 'null'}}, {upsert: false})
    console.log(res)
}

const addOrderIdToProcHistory = async ()=>{
    const res = await ProcurementHistory.find({orderId: 762495504})
    console.log(res.length)
    
    for(let i=0; i< res.length; i++){
        const e = res[i]
        console.log(e._id.toString())
        await ProcurementHistory.findOneAndUpdate({_id: e._id},{$set:{orderId: Math.random().toString().slice(2,11)}})
    }
}

const addInvoiceToProcurements = async ()=>{
    const res = await procurmentModel.find({});
    const bulk =  procurmentModel.collection.initializeOrderedBulkOp()
    console.log(res.length)
    for(let i=0; i<res.length; i++){
        const data = res[i]
        console.log(data.procurementHistory)
        const newHist = data.procurementHistory.map(ele=> ({...Object.assign(ele._doc), invoice:'null'}))
        console.log(newHist)
        bulk.find({_id: data._id}).update({$set:{procurementHistory: newHist}})
    }
    bulk.execute()

}

const addImagesToProcHistory = async ()=>{
    const res = await ProcurementHistory.updateMany({}, {$set: {images: []}}, {upsert: false})
    console.log(res)
}

const addImagesToProcurements = async ()=>{
    const res = await procurmentModel.find({});
    const bulk =  procurmentModel.collection.initializeOrderedBulkOp()
    console.log(res.length)
    for(let i=0; i<res.length; i++){
        const data = res[i]
        console.log(data.procurementHistory)
        const newHist = data.procurementHistory.map(ele=> ({...Object.assign(ele._doc), images:[]}))
        console.log(newHist)
        bulk.find({_id: data._id}).update({$set:{procurementHistory: newHist}})
    }
    bulk.execute()

}

const clearS3 = ()=>{
    const AWS = require('aws-sdk')
    const s3 = new AWS.S3()
    const params = {
        Bucket: `coden-aws-bucket/dev/${path}`,
      };
}

const dbCon = ()=>{
    const env = 'dev'
    mongoose.connect(`mongodb+srv://admin:admin123@cluster0.t2cxv.mongodb.net/nursery_mgmt_${env}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => console.log("Database connected! ", env))
        .catch(err => console.log(err));
}

const addInvoiceIdToBillingHistory = async ()=>{
    const bills = await billingsModel.find({status:{$ne:'BILLED'}})
    for(let i=0; i< bills.length; i++){
        const tracker = await Tracker.findOne({name:"invoiceId"})
        const invoiceId = `NUR_${tracker.number}`
        await billingsModel.findByIdAndUpdate(bills[i]._id, {$set:{invoiceId}}, {upsert: false})
        await Tracker.findOneAndUpdate({name:'invoiceId'}, {$inc:{number:1}}, {$upsert:false})
    }
}

const testApi=async()=>{
    for(let i=0; i< 10; i++){
        await new Promise((res)=> setTimeout(()=> res(), 1000))
        console.log('request', i)
        var options = {
            'method': 'POST',
            'url': 'http://3.110.8.129:8000/api/upload-large',
            'headers': {
            },
            formData: {
              'invoice': {
                'value': fs.createReadStream('/home/nishith/Downloads/videoplayback.mp4'),
                'options': {
                  'filename': 'videoplayback.mp4',
                  'contentType': null
                }
              }
            }
          };
          request(options, function (error, response) {
            if (error) {
                JSON.stringify(error)
                throw new Error(error);
            }
            console.log(response.body);
          });
    }
}

const vendorTypeChange =async()=>{
    const res = await Vendors.updateMany({}, {$set: {type: 'NURSERY'}}, {upsert: false})
    console.log(res)
}

const billingTypeChane = async()=>{
    const res = await billingsModel.updateMany({}, {$set: {type: 'NURSERY'}}, {upsert: false})
    console.log(res)
}

const billingDateChane = async()=>{
    const res = await billingsModel.updateMany({}, [
        {
          $set: {
            billedDate: "$createdAt"
          }
        }
      ]);
    console.log(res)
}


const removeBillingAgri = async (async)=>{
    const res = await billingsModel.deleteMany({type:"AGRI"})
    console.log(res)
}

const caluclateMetaDataAll = async()=>{
    const dates = []
    let minDate = dayjs('2024-07-05', 'YYYY-MM-DD').add(330, 'minutes').toDate()
    const maxDate = dayjs('2024-07-06', 'YYYY-MM-DD').add(330, 'minutes').toDate()
    while(minDate<maxDate){
        dates.push(minDate)
        minDate = dayjs(minDate).add(1, 'day').toDate()
    }
    console.log(dates.length)
    for(let i=0; i<dates.length; i++){
        await caluclateMetaData(dates[i])
        console.log('added-date', dates[i], i)
    }
}


const correctBillData = async()=>{
    const mismatchPipelines = [
        {
          $sort:
            /**
             * Provide any number of field/order pairs.
             */
            {
              billedDate: -1,
            },
        },
        {
          $match:
            /**
             * query: The query in MQL.
             */
            {
              status: "BILLED",
              cashAmount: {
                $exists: true,
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
              amounts: {
                $add: ["$cashAmount", "$onlineAmount"],
              },
            },
        },
        {
          $match:
            /**
             * query: The query in MQL.
             */
            {
              $expr: {
                $ne: ["$amounts", "$totalPrice"],
              },
            },
        },
        
      ]

    const bills = await billingsModel.aggregate(mismatchPipelines)
    console.log(bills.length, 'bill', bills[0])

    for(let i=0; i< bills.length; i++){
        const bill = bills[i]
        const nBill = await billingsModel.findOne({_id:bill._id})
        if(bill.paymentType==='CASH'){
            
            nBill.cashAmount = bill.totalPrice
            await nBill.save()

        }else if(bill.paymentType==='ONLINE'){
            nBill.onlineAmount = bill.totalPrice
            await nBill.save()
        }
    }

}

const updateProcurementName = async (id, newName) => {
  try {
    const updatedProcurement = await procurmentModel.findOneAndUpdate(
      { _id: new mongoose.mongo.ObjectId(id) },
      {$set:{names:newName}},
      {timestamps: false}
    )

    const updatedProcHistory = await procurementHistoryModel.updateMany(
      { procurementId: new mongoose.mongo.ObjectId(id) },
      {$set:{names:newName}},
      {timestamps: false}
    )

    const billings = await billingsModel.find({"items.procurementId": new mongoose.mongo.ObjectId(id)})
    for(let i=0; i< billings.length; i++){
       const bill = billings[i]
       const items = bill.items?.map(ele=> {
        if(ele?.procurementId?.toString()===id){
           ele.procurementName = newName
        }
        return ele
       })
       await billingsModel.updateOne({_id:bill?._id}, {$set: {items}}, {timestamps: false})
    }

    const metaValues = await metaDataModel.updateMany(
      { procurementId: new mongoose.mongo.ObjectId(id) },
      {$set:{names:newName}},
      {timestamps: false}
    )

    const damages = await Damages.updateMany(
      { procurementId: new mongoose.mongo.ObjectId(id) },
      {$set:{names:newName}},
      {timestamps: false}
    )


    return updatedProcurement
  } catch (err) {
    console.error(err)
    throw err
  }
}



const startScripts =async()=>{
    await dbCon()
    
    await new Promise(res=> setTimeout(()=>res(1), 1000))
    // testApi()
    console.log('db connected')
    const name = {
    "en": {
      "name": "tea 1"
    },
    "ka": {
      "name": "ಚಹಾ 1"
    }
  }
   await updateProcurementName("644902225d698cdd131aacd9", name )
   console.log('done')
}

startScripts()