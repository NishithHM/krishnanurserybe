const ProcurementHistory = require("../api/models/procurementHistory.model")
const mongoose = require('mongoose')
const procurmentModel = require("../api/models/procurment.model")
const billingsModel = require("../api/models/billings.model")
const Tracker = require("../api/models/tracker.model")
const Vendors = require("../api/models/vendor.model")

var request = require('request');
var fs = require('fs');

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

const startScripts =async()=>{
    await dbCon()
    
    await new Promise(res=> setTimeout(()=>res(1), 1000))
    console.log('db connected')
    await vendorTypeChange()


    // testApi()
    await billingDateChane()
    console.log('db connected')
}

startScripts()