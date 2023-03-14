const ProcurementHistory = require("../api/models/procurementHistory.model")
const mongoose = require('mongoose')
const procurmentModel = require("../api/models/procurment.model")


const addInvoiceToProcHistory = async ()=>{
    const res = await ProcurementHistory.updateMany({}, {$set: {invoice: 'null'}}, {upsert: false})
    console.log(res)
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

const dbCon = ()=>{
    const env = 'dev'
    mongoose.connect(`mongodb+srv://admin:admin123@cluster0.t2cxv.mongodb.net/nursery_mgmt_${env}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => console.log("Database connected! ", env))
        .catch(err => console.log(err));
}

const startScripts =async()=>{
    await dbCon()
    
    await new Promise(res=> setTimeout(()=>res(1), 1000))
    console.log('db connected')
    await addInvoiceToProcHistory()
}

startScripts()