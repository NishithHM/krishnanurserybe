const ProcurementHistory = require("../api/models/procurementHistory.model");
const mongoose = require("mongoose");
const procurmentModel = require("../api/models/procurment.model");
const billingsModel = require("../api/models/billings.model");
const Tracker = require("../api/models/tracker.model");
const Vendors = require("../api/models/vendor.model");
const excelToJson = require("convert-excel-to-json");
const axios = require('axios')
var request = require("request");
var fs = require("fs");
const dayjs = require("dayjs");
const { caluclateMetaData } = require("../crons/dailyCron");

const exl = require("convert-excel-to-json");
const path = require("path");
const plant_infoModel = require("../api/models/plant_info.model");
const excelFilePath = "Sample-Add-Plants-DEV.xlsx";
var request = require('request');
var fs = require('fs');
const agriOrderMgmtModel = require("../api/models/agriOrderMgmt.model")
const AgriProcurementModel = require("../api/models/AgriProcurement.model")
const agriVariantsModel = require("../api/models/agriVariants.model");
const paymentModel = require("../api/models/payment.model");

const addInvoiceToProcHistory = async () => {
  const res = await ProcurementHistory.updateMany(
    {},
    { $set: { invoice: "null" } },
    { upsert: false }
  );
  console.log(res);
};

const addOrderIdToProcHistory = async () => {
  const res = await ProcurementHistory.find({ orderId: 762495504 });
  console.log(res.length);

  for (let i = 0; i < res.length; i++) {
    const e = res[i];
    console.log(e._id.toString());
    await ProcurementHistory.findOneAndUpdate(
      { _id: e._id },
      { $set: { orderId: Math.random().toString().slice(2, 11) } }
    );
  }
};

const addInvoiceToProcurements = async () => {
  const res = await procurmentModel.find({});
  const bulk = procurmentModel.collection.initializeOrderedBulkOp();
  console.log(res.length);
  for (let i = 0; i < res.length; i++) {
    const data = res[i];
    console.log(data.procurementHistory);
    const newHist = data.procurementHistory.map((ele) => ({
      ...Object.assign(ele._doc),
      invoice: "null",
    }));
    console.log(newHist);
    bulk
      .find({ _id: data._id })
      .update({ $set: { procurementHistory: newHist } });
  }
  bulk.execute();
};

const addImagesToProcHistory = async () => {
  const res = await ProcurementHistory.updateMany(
    {},
    { $set: { images: [] } },
    { upsert: false }
  );
  console.log(res);
};

const addImagesToProcurements = async () => {
  const res = await procurmentModel.find({});
  const bulk = procurmentModel.collection.initializeOrderedBulkOp();
  console.log(res.length);
  for (let i = 0; i < res.length; i++) {
    const data = res[i];
    console.log(data.procurementHistory);
    const newHist = data.procurementHistory.map((ele) => ({
      ...Object.assign(ele._doc),
      images: [],
    }));
    console.log(newHist);
    bulk
      .find({ _id: data._id })
      .update({ $set: { procurementHistory: newHist } });
  }
  bulk.execute();
};

const clearS3 = () => {
  const AWS = require("aws-sdk");
  const s3 = new AWS.S3();
  const params = {
    Bucket: `coden-aws-bucket/dev/${path}`,
  };
};


const updateDate =async ()=>{
  const payments =await paymentModel.find({date:null})
  for(let i=0; i< payments.length; i++){
    const payment = payments[i]
    payment.date = dayjs(payment.createdAt).format('YYYY-MM-DD')
    await payment.save({timestamps: false})
  }
}



const dbCon = ()=>{
    const env = 'dev'
    mongoose.connect(`mongodb+srv:///nursery_mgmt_${env}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => console.log("Database connected! ", env))
    .catch((err) => console.log(err));
};





const readXlAndStore = (sheetName) => {
  let columnToKey;
  if(sheetName==='Plant Info'){
    columnToKey = {
      A: "SLNO",
      B: "name",
      C: "nameForCustomer",
      D: "sellingPrice",
      E: "discountedSellingPrice",
      F: "coverImages",
      G: "tips",
      H: "moreInfo",
      I: "tags",
      J: "sectionName",
      K: "sectionInfo",
      L: "sections",
    };
  }

  if(sheetName==='Section'){
    // Section Name	Type	Stack	Plants
    columnToKey = {
      A: "Section Name",
      B: "Type",
      C: "Stack",
      D: "Plants",
    };
  }

  const result = exl({
    source: fs.readFileSync( path.join(__dirname, excelFilePath)),
    columnToKey,
  });

  return new Promise((resolve, reject) => {
    // console.log(result, "result");
    if (!result[sheetName]?.length) reject(new Error("No data found"));
    resolve(result[sheetName].slice(1));
  });
};

const convertImgaeToBase64 =(arr)=>{
  return arr.map(ele=> fs.readFileSync(ele, {encoding: 'base64'}));
}

const addInvoiceIdToBillingHistory = async () => {
  const bills = await billingsModel.find({ status: { $ne: "BILLED" } });
  for (let i = 0; i < bills.length; i++) {
    const tracker = await Tracker.findOne({ name: "invoiceId" });
    const invoiceId = `NUR_${tracker.number}`;
    await billingsModel.findByIdAndUpdate(
      bills[i]._id,
      { $set: { invoiceId } },
      { upsert: false }
    );
    await Tracker.findOneAndUpdate(
      { name: "invoiceId" },
      { $inc: { number: 1 } },
      { $upsert: false }
    );
  }
};

const testApi = async () => {
  for (let i = 0; i < 10; i++) {
    await new Promise((res) => setTimeout(() => res(), 1000));
    console.log("request", i);
    var options = {
      method: "POST",
      url: "http://3.110.8.129:8000/api/upload-large",
      headers: {},
      formData: {
        invoice: {
          value: fs.createReadStream(
            "/home/nishith/Downloads/videoplayback.mp4"
          ),
          options: {
            filename: "videoplayback.mp4",
            contentType: null,
          },
        },
      },
    };
    request(options, function (error, response) {
      if (error) {
        JSON.stringify(error);
        throw new Error(error);
      }
      console.log(response.body);
    });
  }
};

const vendorTypeChange = async () => {
  const res = await Vendors.updateMany(
    {},
    { $set: { type: "NURSERY" } },
    { upsert: false }
  );
  console.log(res);
};

const billingTypeChane = async () => {
  const res = await billingsModel.updateMany(
    {},
    { $set: { type: "NURSERY" } },
    { upsert: false }
  );
  console.log(res);
};

const billingDateChane = async () => {
  const res = await billingsModel.updateMany({}, [
    {
      $set: {
        billedDate: "$createdAt",
      },
    },
  ]);
  console.log(res);
};

const removeBillingAgri = async (async) => {
  const res = await billingsModel.deleteMany({ type: "AGRI" });
  console.log(res);
};

const caluclateMetaDataAll = async () => {
  const dates = [];
  let minDate = dayjs("2024-07-05", "YYYY-MM-DD").add(330, "minutes").toDate();
  const maxDate = dayjs("2024-07-06", "YYYY-MM-DD")
    .add(330, "minutes")
    .toDate();
  while (minDate < maxDate) {
    dates.push(minDate);
    minDate = dayjs(minDate).add(1, "day").toDate();
  }
  console.log(dates.length);
  for (let i = 0; i < dates.length; i++) {
    await caluclateMetaData(dates[i]);
    console.log("added-date", dates[i], i);
  }
};


const excelImport= async (sheetName)=>{

    readXlAndStore(sheetName).then((data) => {


      // console.log(convertedData[0].sections, "convertedData");

      // let dataToSend = {};
      const convertedData = []
      for(let i=0;i<data.length; i++){
        const row = data[i]
        if(typeof row['SLNO']=== "number"){
          row.coverImages = [row.coverImages]
          row.tags = [row.tags]
          row.sections = [{image: convertImgaeToBase64([row.sections])[0], text: row.sectionName, info: row.sectionInfo}]
          row.tips = [row.tips]
          delete row.sectionName;
          delete row.sectionInfo
          convertedData.push(row)
        }else if(row.coverImages || row.tags || row.sections || row.tips || row.sectionName || row.sectionInfo){
          const rowPrev = convertedData.pop()
          if(rowPrev){
            if(row.coverImages)
              rowPrev.coverImages = [...rowPrev.coverImages, row.coverImages ]
            if(row.tags)
              rowPrev.tags = [...rowPrev.tags, row.tags ]
            if(row.sections && row.sectionName && row.sectionInfo)
              rowPrev.sections = [...rowPrev.sections, {image: convertImgaeToBase64([row.sections])[0], text: row.sectionName, info: row.sectionInfo} ]
            if(row.tips)
              rowPrev.tips = [...rowPrev.tips, row.tips ]  
            convertedData.push(rowPrev)
          }
        }
      }

      convertedData.forEach(async (ele) => {
        const procId = await procurmentModel
          .findOne({"names.en.name":{$regex:ele?.name, $options:'i'}})
          .select("_id");
        console.log(ele?.name, procId)
        console.log(procId._id?.toString(), "procId");
        const dataToSend = {
          nameForCustomer: ele.nameForCustomer,
          sellingPrice: ele.sellingPrice,
          discountedSellingPrice: ele.discountedSellingPrice,
          coverImages: convertImgaeToBase64(ele.coverImages),
          tips: ele.tips,
          moreInfo: ele.moreInfo,
          tags: ele.tags,
          sections: ele.sections,
          procurementId: procId._id?.toString(),
        };
        const res = await axios.post(
          "http://localhost:8000/api/customer/plant-info/add",
          dataToSend,
          {
            headers: {
              "Content-Type": "application/json",
              authorization:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NDk0NzM2ZWUwNjE1ZWY2Mzc3MjU2MyIsIm5hbWUiOiJhZG1pbjEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzUzNzE3NjcsImV4cCI6MTczNTQ1ODE2N30.jOTv1x4GBhbj8JG4Ld-B2qfxk6HngX7aM7QQPae6yJw",
            },
          }
        );
        const plantData = await res.data;
        console.log(plantData)
        const pubRes = axios.get(`http://localhost:8000/api/customer/plant-info/publish/${plantData?.data?.procurementId}`, {
          headers: {
            "Content-Type": "application/json",
            authorization:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NDk0NzM2ZWUwNjE1ZWY2Mzc3MjU2MyIsIm5hbWUiOiJhZG1pbjEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzUzNzE3NjcsImV4cCI6MTczNTQ1ODE2N30.jOTv1x4GBhbj8JG4Ld-B2qfxk6HngX7aM7QQPae6yJw",
          },
        })
        await new Promise(res=> setTimeout(()=> res(), 200))
        console.log('succesfully added')
      });
    });
    
}

const sectionImport = async(sheetName)=>{
  readXlAndStore(sheetName).then(async (data) => {
    for(let i=0; i<data.length;i++){
      const {Plants, Type, Stack,} = data[i]
     const plantData = await plant_infoModel.find({"names.customer.name":{$in:Plants.split(',')}}, {procurementId:1})
     const body = {
      type: Type,
      plants: plantData.map(e=> e.procurementId.toString()),
      stack: Stack,
      name: data[i]['Section Name']
     }
     console.log(body)
     const res = await axios.post(
      "http://localhost:8000/api/customer/section/add",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          authorization:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NDk0NzM2ZWUwNjE1ZWY2Mzc3MjU2MyIsIm5hbWUiOiJhZG1pbjEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzUzNzE3NjcsImV4cCI6MTczNTQ1ODE2N30.jOTv1x4GBhbj8JG4Ld-B2qfxk6HngX7aM7QQPae6yJw",
        },
      }
    );
    }
  })
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

const migrateProcurementPayments = async () => {
  const procurementHistoryModel = require('../api/models/procurementHistory.model')
  const paymentModel = require('../api/models/payment.model')

  const procurements = await procurementHistoryModel.find({ totalPrice: { $gt: 0 }, status:"VERIFIED" })
  console.log(procurements.length)

  for (const procurement of procurements) {

      const newPayment = new paymentModel({
        name: procurement.vendorName || 'Unknown Vendor',
        contact: procurement.vendorContact || '',
        amount: procurement.totalPrice,
        type: 'VENDOR',
        transferType: 'ONLINE', // Assuming default transfer type
        comment: `Migrated from procurement history: ${procurement.descriptionProc || ''}`,
        onlineAmount: procurement.totalPrice,
        vendorId: procurement.vendorId || null,
        businessType: 'NURSERY', // Assuming default business type
        createdAt: procurement.createdAt,
        updatedAt: procurement.updatedAt
      })

      await newPayment.save()
      
  }

  console.log(`Migrated ${procurements.length} procurement payments`)
}

const correctAgriRemQty = async()=>{
  const pipeline = [
    {
      $match:
        /**
         * query: The query in MQL.
         */
        {
          status: "VERIFIED",
        },
    },
    {
      $group:
        /**
         * _id: The id of the group.
         * fieldN: The first field name.
         */
        {
          _id: "$names",
          sum: {
            $sum: "$quantity",
          },
        },
    },
  ]
  const procHistory = await agriOrderMgmtModel.aggregate(pipeline)

  for (let i = 0; i < procHistory.length; i++) {
    const record = procHistory[i]
    // Process each record as needed
    console.log(record)
    const proc = await AgriProcurementModel.findOne({names:record._id})
    proc.remainingQuantity = record.sum
    await proc.save()
  }
}  

const totalPriceWithoutGst = async ()=>{
  const procHistory = await agriOrderMgmtModel.find({gst:0})

  for (let i = 0; i < procHistory.length; i++) {
    const record = procHistory[i]
    // Process each record as needed
    console.log(record)
    const variantData = await agriVariantsModel.findOne({type: record.type, name: record.typeName})
    if(variantData?.gst){
    record.totalPriceWithoutGst = (record.totalPrice/(1+variantData?.gst/100)).toFixed(2)
    record.gst = (record.totalPrice - (record.totalPrice/(1+variantData?.gst/100))).toFixed(2)
    console.log(record)
    await record.save()
    }
  }
}



const startScripts =async()=>{
    await dbCon()
    
    await new Promise(res=> setTimeout(()=>res(1), 1000))
    // testApi()
    console.log('db connected')
  //  await excelImport("Plant Info")
      // await sectionImport('Section')
    console.log('done')
    // await updateDate()
    // await caluclateMetaDataAll()
  //  await excelImport("Plant Info")
      // await sectionImport('Section')
    // console.log('done')

}


startScripts();
