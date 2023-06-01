const ProcurementHistory = require("../api/models/procurementHistory.model")
const mongoose = require('mongoose')
const procurmentModel = require("../api/models/procurment.model")
const billingsModel = require("../api/models/billings.model")
const Tracker = require("../api/models/tracker.model")


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
    const bills = await billingsModel.find({status:'BILLED'})
    console.log(bills)
    for(let i=0; i< bills.length; i++){
        const tracker = await Tracker.findOne({name:"invoiceId"})
        const invoiceId = `NUR_${tracker.number}`
        await billingsModel.findByIdAndUpdate(bills[i]._id, {$set:{invoiceId}}, {upsert: false})
        await Tracker.findOneAndUpdate({name:'invoiceId'}, {$inc:{number:1}}, {$upsert:false})
    }
}

const startScripts =async()=>{
    await dbCon()
    
    await new Promise(res=> setTimeout(()=>res(1), 1000))
    console.log('db connected')
    addInvoiceIdToBillingHistory()

}

startScripts()