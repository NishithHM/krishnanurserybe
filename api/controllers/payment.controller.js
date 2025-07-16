const { isEmpty } = require("lodash");
const loggers = require("../../loggers");
const Broker = require("../models/broker.model");
const Payment = require("../models/payment.model");
const Billing = require("../models/billings.model");
const dayjs = require('dayjs')
const { handleMongoError } = require("../utils");
const Tracker = require("../models/tracker.model");
const vendorModel = require("../models/vendor.model");

exports.addPayment = async (req, res) => {
  try {
    const paymentData = {};
    const {
      brokerName,
      invoiceId,
      brokerNumber,
      empName,
      amount,
      type,
      brokerId,
      transferType,
      phoneNumber,
      accountNumber,
      ifscCode,
      bankName,
      comment,
      cashAmount,
      onlineAmount,
      vendorId,
      businessType,
      date
    } = req.body;
    const role = req?.token?.role;
    let broker;
    if (invoiceId) {
      paymentData.invoiceId = invoiceId;
    }
    if (brokerName) {
      if (!brokerId) {
        broker = new Broker({ name: brokerName, contact: brokerNumber });
        paymentData.brokerId = broker._id;
      } else {
        paymentData.brokerId = brokerId;
      }
      const bill = await Billing.findOne({ invoiceId });
      if (!bill) {
        res.status(400).json({
          message: "Invalid invoice id",
        });
        return;
      }

      if (bill) {
        const repeatedPayment = await Payment.findOne({ invoiceId });
        if (repeatedPayment) {
          console.log(repeatedPayment);
          return res.status(400).json({
            message: `Duplicate invoice entry for Bill Number ${invoiceId} `,
          });
        }
      }
      paymentData.type = "BROKER";
      paymentData.name = brokerName;
      paymentData.contact = brokerNumber;
    } else if (role === "sales" && type === "SALARY") {
      res.status(400).json({
        message: "Sales cannot create",
      });
      return;
    } else {
      paymentData.type = type;
      paymentData.name = empName;
      paymentData.transferType = transferType;
      paymentData.phoneNumber = phoneNumber
      paymentData.accountNumber = accountNumber
      paymentData.ifscCode = ifscCode
      paymentData.bankName = bankName
      paymentData.comment = comment
      paymentData.cashAmount = cashAmount
      paymentData.onlineAmount = onlineAmount
    }

    paymentData.amount = amount;
    paymentData.businessType = businessType;
    paymentData.date = date || dayjs().format("YYYY-MM-DD");
    if(type==='VENDOR'){
      paymentData.vendorId = vendorId;
      const vendor = await vendorModel.findById(vendorId);
      paymentData.empName = vendor?.name
      vendor.deviation = vendor.deviation - amount
      await vendor.save()
    }
    const payment = new Payment({ ...paymentData });
    await payment.save();

    if (brokerName && !brokerId) {
      broker.save();
    }
    const capital = businessType==='NURSERY' ? await Tracker.findOne({name:'capital'}) : await Tracker.findOne({name:'capitalAgri'})

 
    if(type==='CAPITAL'){
      capital.number = capital.number + parseInt(amount, 10)
    }else{
      capital.number = capital.number - parseInt(amount, 10)
    }
    await capital.save()

    
    res.json({
      message: "Successfully Created",
    });
  } catch (error) {
    console.log(error);
    loggers.info(`addPayment-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const {
      pageNumber,
      isCount,
      startDate,
      endDate,
      sortBy,
      sortType,
      search,
      type,
      businessType,
      vendorId
    } = req.body;
    const role = req?.token?.role;
    let typeFilter = type;
    if (role === "sales") {
      typeFilter = { $in: ["BROKER", "OTHERS"] };
    }
    const match = {businessType};

    if (typeFilter) {
      match.type = typeFilter;
    }
    
    if(vendorId && type==='VENDOR'){
      match.vendorId = vendorId
    }

    if(type){
      match.type = typeFilter;
    }

      if (startDate && endDate) {
        match.date = {
          $gte: dayjs(startDate, "YYYY-MM-DD").toDate(),
          $lt: dayjs(endDate, "YYYY-MM-DD").add(1, "day").toDate(),
        };
      }
      const searchNumber = parseInt(search, 10) || 1;
      if (search) {
        match.$or = [
          { name: { $regex: search, $options: "i" } },
          { comment: { $regex: search, $options: "i" } },
          { phoneNumber: search },
          { contact: search },
          { amount: searchNumber },
        ];
      }
    const pagination = [
      {
        $skip: 10 * (pageNumber - 1),
      },
      {
        $limit: 10,
      },
    ];

    const count = [
      {
        $count: "count",
      },
    ];
    const pipeline = [];
    const sumPipeline = []

    let sortStage;
    if (sortBy) {
      sortStage = [
        {
          $sort: {
            [sortBy]: parseInt(sortType),
          },
        },
      ];
    } else {
      sortStage = [
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ];
    }
    if (!isEmpty(match)) {
      const matchVal = [{ $match: { ...match } }];
      pipeline.push(...matchVal);
      sumPipeline.push(...matchVal)
    }
    if(count!=="true"){
        pipeline.push(...sortStage);
      if (pageNumber) {
        pipeline.push(...pagination);
      }
    }

    if (isCount === "true") {
      pipeline.push(...count);
    }
    console.log("getPaymentHistory-pipeline", JSON.stringify(pipeline));
    loggers.info(`getPaymentHistory-pipeline, ${JSON.stringify(pipeline)}`);
    // sumPipeline.push(match)
    const results = await Payment.aggregate(pipeline);
    let sum
    let remainingCapital
    let vendorDeviation
    if(type){
      const sumGroup = {
        $group:{
          _id:"$type",
          amount:{
            $sum: "$amount"
          }
        }
      }
      sumPipeline.push(sumGroup)

      console.log(`getPaymentHistory-pipeline-sum, ${JSON.stringify(sumPipeline)}`);

      sum = await Payment.aggregate(sumPipeline);
      sum = sum?.[0]?.amount
      if(type==='CAPITAL'){
         const capital = businessType === 'NURSERY' ? await Tracker.findOne({name:'capital'}) : await Tracker.findOne({name:'capitalAgri'})
         remainingCapital = capital.number
      }
      if(type==='VENDOR' && vendorId){
        const vendor = await vendorModel.findById(vendorId)
        vendorDeviation = vendor.deviation
     }
    }
    if (results.length === 0 && isCount === "true") {
      res.json({data:[{ count: 0 }]});
    } else {
      res.json({data:results, sum, remainingCapital, vendorDeviation});
    }
  } catch (error) {
    console.log(error);
    loggers.info(`getPaymentHistory-errr, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};


exports.getPaymentInfo = async (req, res)=>{
  const {phoneNumber} = req.body
  let paymentData = await Payment.findOne({$or:[{phoneNumber}, {name:phoneNumber}], accountNumber:{$exists:true}}).sort({createdAt:-1})
  if(!paymentData){
    paymentData = await Payment.findOne({$or:[{phoneNumber}, {name:phoneNumber}]}).sort({createdAt:-1})
  }
  res.json(paymentData)
}

exports.getPaymentInfoByName = async (req, res)=>{
  const {search} = req.body
  const paymentData = await Payment.aggregate([
  {
    $match:
      /**
       * query: The query in MQL.
       */
      {
        name: {
          $regex: search,
          $options: "i"
        },
        accountNumber:{$exists:true}
      }
  },
  {
    $group:
      /**
       * _id: The id of the group.
       * fieldN: The first field name.
       */
      {
        _id: "$name",
        data: {
          $first: "$$ROOT"
        }
      }
  },
  {
    $replaceRoot:
      /**
       * replacementDocument: A document or string.
       */
      {
        newRoot: "$data"
      }
  },
  {
    $sort:{
      createdAt: -1
    }
  }
  ]);
  res.json(paymentData)
}