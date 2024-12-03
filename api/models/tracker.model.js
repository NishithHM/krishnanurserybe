const { isEmpty } = require('lodash')
const mongoose = require('mongoose')
const tracker = new mongoose.Schema({
	name: {
        type: String,
        required: true,
        unique: true,
    },
   number:{
        type: Number,
        required: true,
   },
}, {
	timestamps: true
})

const Tracker = mongoose.model("tracker", tracker)


const createDefaults =async ()=>{
     const data = await Tracker.findOne({name:'invoiceId'})
     if(isEmpty(data)){
     try {
          const initial = new Tracker({name:'invoiceId', number:00001})
          initial.save()
               
          } catch (error) {
               console.log(error)
          }
     }

     const dataAgri = await Tracker.findOne({name:'agriInvoiceId'})
     if(isEmpty(dataAgri)){
     try {
          const initial = new Tracker({name:'agriInvoiceId', number:00001})
          initial.save()
               
          } catch (error) {
               console.log(error)
          }
     }
     const dataCapital = await Tracker.findOne({name:'capital'})
     if(isEmpty(dataCapital)){
          try {
               const initial = new Tracker({name:'capital', number:0})
          }
          catch (error) {
               console.log(error)
          }
     }
     const dataCustomer= await Tracker.findOne({name:'customerInvoiceId'})
     if(isEmpty(dataCustomer)){
     try {
          const initial = new Tracker({name:'agriInvoiceId', number:00001})
          initial.save()
               
          } catch (error) {
               console.log(error)
          }
     }
}

createDefaults()
module.exports = Tracker;