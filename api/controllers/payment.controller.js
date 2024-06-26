const { isEmpty } = require("lodash");
const loggers = require("../../loggers");
const Broker = require("../models/broker.model");
const Payment = require("../models/payment.model");
const Billing = require("../models/billings.model");
const dayjs = require('dayjs')
const { handleMongoError } = require("../utils");

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
      onlineAmount
    } = req.body;
    console.log(brokerName, invoiceId, brokerName, empName, amount, type);
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
    const payment = new Payment({ ...paymentData });
    await payment.save();
    if (brokerName && !brokerId) {
      broker.save();
    }
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
    } = req.body;
    const role = req?.token?.role;
    let typeFilter = type;
    if (role === "sales") {
      typeFilter = { $in: ["BROKER", "OTHERS"] };
    }
    const match = {};

    if (typeFilter) {
      match.type = typeFilter;
    }
    if (!isCount) {
      if (startDate && endDate) {
        match.createdAt = {
          $gte: dayjs(startDate, "YYYY-MM-DD").toDate(),
          $lt: dayjs(endDate, "YYYY-MM-DD").add(1, "day").toDate(),
        };
      }
      if (search) {
        match.$or = [
          { name: { $regex: search, $options: "i" } },
          { invoiceId: { $regex: search, $options: "i" } },
          { customerNumber: search },
        ];
      }
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
    }
    pipeline.push(...sortStage);
    if (pageNumber) {
      pipeline.push(...pagination);
    }

    if (isCount === "true") {
      pipeline.push(...count);
    }
    console.log("getPaymentHistory-pipeline", JSON.stringify(pipeline));
    loggers.info(`getPaymentHistory-pipeline, ${JSON.stringify(pipeline)}`);
    const results = await Payment.aggregate(pipeline);
    if (results.length === 0 && isCount === "true") {
      res.json([{ count: 0 }]);
    } else {
      res.json(results);
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
  const paymentData = await Payment.findOne({phoneNumber}).sort({createdAt:-1})
  res.json(paymentData)
}