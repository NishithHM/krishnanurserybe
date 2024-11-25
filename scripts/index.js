const ProcurementHistory = require("../api/models/procurementHistory.model");
const mongoose = require("mongoose");
const procurmentModel = require("../api/models/procurment.model");
const billingsModel = require("../api/models/billings.model");
const Tracker = require("../api/models/tracker.model");
const Vendors = require("../api/models/vendor.model");
const excelToJson = require("convert-excel-to-json");

var request = require('request');
var fs = require('fs');
const dayjs = require("dayjs")
const { caluclateMetaData } = require("../crons/dailyCron")
const agriOrderMgmtModel = require("../api/models/agriOrderMgmt.model")
const AgriProcurementModel = require("../api/models/AgriProcurement.model")

const exl = require("convert-excel-to-json");
const excelFilePath = "plat-data.xlsx";

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

const dbCon = ()=>{
    const env = 'dev'
    mongoose.connect(`/nursery_mgmt_${env}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => console.log("Database connected! ", env))
    .catch((err) => console.log(err));
};

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

const correctBillData = async () => {
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
  ];

  const bills = await billingsModel.aggregate(mismatchPipelines);
  console.log(bills.length, "bill", bills[0]);

  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i];
    const nBill = await billingsModel.findOne({ _id: bill._id });
    if (bill.paymentType === "CASH") {
      nBill.cashAmount = bill.totalPrice;
      await nBill.save();
    } else if (bill.paymentType === "ONLINE") {
      nBill.onlineAmount = bill.totalPrice;
      await nBill.save();
    }
  }
};

const readXlAndStore = () => {
  const columnToKey = {
    A: "SLNO",
    B: "name",
    C: "nameForCustomer",
    D: "sellingPrice",
    E: "discountedSellingPrice",
    F: "coverImages",
    G: "tips",
    H: "moreInfo",
    I: "tags",
    // J: "sectionName",
    // K: "sectionInfo",
    L: "sections",
  };

  const result = exl({
    source: fs.readFileSync(excelFilePath),
    columnToKey,
  });

  return new Promise((resolve, reject) => {
    // console.log(result, "result");
    if (!result["Plant Info"]?.length) reject(new Error("No data found"));
    resolve(result["Plant Info"].slice(1));
  });
};

readXlAndStore().then((data) => {
  //   console.log(data, "data");

  const mergeDuplicates = (data) => {
    const mergedData = [];

    data.forEach((item) => {
      const lastItem = mergedData[mergedData.length - 1];

      if (lastItem && lastItem.SLNO === item.SLNO) {
        Object.keys(item).forEach((key) => {
          if (key !== "SLNO") {
            if (lastItem[key]) {
              if (!Array.isArray(lastItem[key])) {
                lastItem[key] = [lastItem[key]];
              }
              lastItem[key].push(item[key]);
            } else {
              lastItem[key] = item[key];
            }
          }
        });
      } else {
        mergedData.push({ ...item });
      }
    });

    return mergedData;
  };

  let convertedData = processArray(mergeDuplicates(data));

  // console.log(convertedData[0].sections, "convertedData");

  // let dataToSend = {};

  convertedData.forEach(async (ele) => {
    const procId = await procurmentModel
      .findOne({
        "names.en.name": ele?.name,
      })
      .select("_id");

    // console.log(procId._id?.toString(), "procId");
    const dataToSend = {
      nameForCustomer: ele.nameForCustomer,
      sellingPrice: ele.sellingPrice,
      discountedSellingPrice: ele.discountedSellingPrice,
      coverImages: ele.coverImages,
      tips: ele.tips,
      moreInfo: ele.moreInfo,
      tags: ele.tags,
      sections: ele.sections,
      procurementId: procId._id?.toString(),
    };

    const res = await fetch(
      "http://15.207.187.17:8000/api/customer/plant-info/add",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NDk0NzM2ZWUwNjE1ZWY2Mzc3MjU2MyIsIm5hbWUiOiJhZG1pbjEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjI4Nzg2NTEsImV4cCI6MTcyMjk2NTA1MX0.iRTRrPcwpI25fBPSBW0W57tWPuEQrP0q5ifBGAHIpSk",
        },
        body: JSON.stringify(dataToSend),
      }
    );
    console.log(await res.json());
  });
});

function processArray(arr) {
  const result = {};
  const arrayProperties = {};

  function processSections(sections) {
    if (typeof sections === "string") {
      return [{ image: sections, text: "section1.png" }];
    } else if (Array.isArray(sections)) {
      return sections.map((section, index) => ({
        image: section,
        text: `section${index + 1}.png`,
      }));
    }
    return [];
  }

  function ensureArray(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  // First pass: Separate objects with SLNO and collect array properties
  arr.forEach((obj) => {
    if (obj.SLNO) {
      result[obj.SLNO] = { ...obj };
      result[obj.SLNO].sections = processSections(obj.sections);
      // Ensure tags and tips are arrays
      result[obj.SLNO].tags = ensureArray(obj.tags);
      result[obj.SLNO].tips = ensureArray(obj.tips);
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        if (
          Array.isArray(value) ||
          key === "sections" ||
          key === "tags" ||
          key === "tips"
        ) {
          if (!arrayProperties[key]) {
            arrayProperties[key] = [];
          }
          if (key === "sections") {
            arrayProperties[key].push(...processSections(value));
          } else if (key === "tags" || key === "tips") {
            arrayProperties[key].push(...ensureArray(value));
          } else {
            arrayProperties[key].push(...value);
          }
        }
      });
    }
  });

  // Remove duplicates from collected array properties
  Object.keys(arrayProperties).forEach((key) => {
    if (key === "sections") {
      // For sections, remove duplicates based on data
      arrayProperties[key] = arrayProperties[key].filter(
        (obj, index, self) =>
          index === self.findIndex((t) => t.data === obj.data)
      );
    } else {
      arrayProperties[key] = [...new Set(arrayProperties[key])];
    }
  });

  // Second pass: Merge array properties into objects with SLNO
  Object.values(result).forEach((obj) => {
    Object.entries(arrayProperties).forEach(([key, value]) => {
      if (key === "sections") {
        obj[key] = [...(obj[key] || []), ...value];
      } else if (key === "tags" || key === "tips") {
        obj[key] = [...ensureArray(obj[key]), ...value];
      } else if (Array.isArray(obj[key])) {
        obj[key] = [...obj[key], ...value];
      } else if (obj[key]) {
        obj[key] = [obj[key], ...value];
      } else {
        obj[key] = value;
      }
    });

    // Remove duplicates from all array properties in the final object
    Object.keys(obj).forEach((key) => {
      if (Array.isArray(obj[key])) {
        if (key === "sections") {
          // For sections, remove duplicates based on data
          obj[key] = obj[key].filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.data === item.data)
          );
        } else {
          obj[key] = [...new Set(obj[key])];
        }
      }
    });

    // Ensure sections is always an array with the correct structure
    if (!obj.sections) {
      obj.sections = [];
    }

    // Ensure tags and tips are always arrays
    obj.tags = ensureArray(obj.tags);
    obj.tips = ensureArray(obj.tips);
  });

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



const startScripts =async()=>{
    await dbCon()
    
    await new Promise(res=> setTimeout(()=>res(1), 1000))
    // testApi()
    console.log('db connected')
    await correctAgriRemQty()
    console.log('done')
}

  // caluclateMetaDataAll();
};

startScripts();

