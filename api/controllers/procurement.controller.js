const Procurement = require("../models/procurment.model");
const Vendor = require("../models/vendor.model");
const ProcurementHistory = require("../models/procurementHistory.model");
const DamageHistory = require("../models/damageHistory.model");
const Payment = require('../models/payment.model');
const mongoose = require("mongoose");
const uuid = require("uuid");
const dayjs = require("dayjs");
const uniq = require("lodash/uniq");
const { handleMongoError, uploadFile } = require("../utils");
const loggers = require("../../loggers");
const { isEmpty, isNumber } = require("lodash");
const { ObjectId } = require("mongodb");
const Tracker = require("../models/tracker.model");

exports.requestOrder = async (req, res) => {
  const { nameInEnglish, totalQuantity, id, descriptionSales, ownProduction } =
    req.body;
  const names = {
    en: {
      name: nameInEnglish,
    },
    ka: {
      name: "",
    },
  };
  const vendorData = {};
  const requestedBy = {
    _id: req?.token?.id,
    name: req?.token?.name,
  };
  if (ownProduction) {
    const vData = await Vendor.findOne({ isDefault: true });
    vendorData.vendorName = vData.name;
    vendorData.vendorContact = vData.contact;
    vendorData.vendorId = vData._id.toString();
  }
  let procurement;
  let procurementHis;
  if (id) {
    procurement = await Procurement.findById(id);
  } else {
    procurement = new Procurement({ names, remainingQuantity: 0 });
  }
  try {
    if (id) {
      procurementHis = new ProcurementHistory({
        procurementId: procurement._id,
        names: procurement.names,
        requestedQuantity: totalQuantity,
        requestedBy,
        status: "REQUESTED",
        descriptionSales,
        ...vendorData,
      });
    } else {
      const res = await procurement.save();
      procurementHis = new ProcurementHistory({
        procurementId: res._id,
        names,
        requestedQuantity: totalQuantity,
        requestedBy,
        descriptionSales,
        status: "REQUESTED",
        ...vendorData,
      });
    }
    await procurementHis.save();
    res.status(201).json({
      message: "Successfully Requested",
    });
  } catch (error) {
    console.log(error);
    loggers.info(`addNewProcurement-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.placeOrder = async (req, res) => {
  const {
    nameInEnglish,
    totalQuantity,
    nameInKannada,
    vendorContact,
    vendorName,
    vendorId,
    description,
    categories,
    id,
    procurementId,
    totalPrice,
    currentPaidAmount,
    expectedDeliveryDate,
    orderId,
  } = req.body;
  const names = {
    en: {
      name: nameInEnglish,
    },
    ka: {
      name: nameInKannada,
    },
  };
  let newVendorId;
  if (!vendorId) {
    const vendorData = new Vendor({
      contact: vendorContact,
      name: vendorName,
      type: "NURSERY",
    });
    newVendorId = vendorData._id;
    vendorData.save();
  }
  const placedBy = {
    _id: req?.token?.id,
    name: req?.token?.name,
  };
  const newData = {
    names,
    orderedQuantity: totalQuantity,
    descriptionProc: description,
    placedBy,
    vendorName,
    vendorContact,
    vendorId: vendorId || newVendorId,
    status: "PLACED",
    expectedDeliveryDate: dayjs(expectedDeliveryDate, "YYYY-MM-DD"),
    currentPaidAmount,
    totalPrice,
    orderId,
  };
  try {
    if (id) {
      let procurementHis = await ProcurementHistory.findById(id);
      const proc = await Procurement.findById(procurementHis.procurementId);
      proc.names = names;
      proc.categories = categories;
      procurementHis.names = names;
      (procurementHis.orderedQuantity = totalQuantity),
        (procurementHis.descriptionProc = description),
        (procurementHis.placedBy = placedBy),
        (procurementHis.vendorName = vendorName),
        (procurementHis.vendorContact = vendorContact),
        (procurementHis.vendorId = vendorId || newVendorId),
        (procurementHis.status = "PLACED"),
        (procurementHis.orderId = orderId);
      (procurementHis.expectedDeliveryDate = dayjs(
        expectedDeliveryDate,
        "YYYY-MM-DD"
      )),
        (procurementHis.currentPaidAmount = currentPaidAmount);
      procurementHis.totalPrice = totalPrice;

      procurementHis.save();
      proc.save();
      res.status(200).json({
        message: "Successfully Placed",
      });
    } else {
      let procId;
      if (procurementId) {
        procId = procurementId;
        const proc = await Procurement.findById(procurementId);
        proc.categories = categories;
        await proc.save();
      } else {
        const procurement = new Procurement({
          names,
          remainingQuantity: 0,
          categories,
        });
        const res = await procurement.save();
        procId = res._id;
      }
      const procurementHis = new ProcurementHistory({
        procurementId: procId,
        requestedQuantity: totalQuantity,
        requestedBy: placedBy,
        ...newData,
      });
      await procurementHis.save();
      res.status(200).json({
        message: "Successfully Placed",
      });
    }
  } catch (error) {
    console.log(error);
    loggers.info(`addNewProcurement-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.rejectOrderRequest = async (req, res) => {
  const { id, description } = req.body;
  const procHistory = await ProcurementHistory.findOne({
    _id: new mongoose.mongo.ObjectId(id),
    status: "REQUESTED",
  });
  if (procHistory) {
    procHistory.status = "REJECTED";
    procHistory.descriptionProc = description;
    procHistory.save();
    res.status(200).json({
      message: "Successfully Rejected",
    });
  } else {
    res.status(400).json({
      message: "Unable to reject",
    });
  }
};

exports.verifyOrder = async (req, res) => {
  try {
    const { id, quantity } = req.body;
    const keys = [];
    const paths = [];
    if (!isEmpty(req.files)) {
      req.files.map((ele) => {
        const key = uuid.v4();
        keys.push(key);
        const [name, type] = ele?.filename ? ele.filename.split(".") : [];
        paths.push(`nursery/procurements/${key}.${type}`);
      });
    } else {
      res.status(422).json({
        message: "Plant Images are required",
      });
      return;
    }
    const procHistory = await ProcurementHistory.findOne({
      _id: new mongoose.mongo.ObjectId(id),
      status: "PLACED",
    });
    if (procHistory) {
      procHistory.status = "VERIFIED";
      procHistory.quantity = quantity;
      procHistory.images = paths;
      const procurment = await Procurement.findById(procHistory.procurementId);
      procurment.remainingQuantity =
        procurment.remainingQuantity + parseInt(quantity, 10);
      procurment.lastProcuredOn = new Date();
      await procurment.save();
      await procHistory.save();
      if (!isEmpty(req.files)) {
        req.files.map((ele, index) => {
          const [name, type] = ele.filename ? ele.filename.split(".") : [];
          uploadFile({
            file: ele,
            path: "nursery/procurements",
            key: `${keys[index]}.${type}`,
          });
        });
      }
      res.status(200).json({
        message: "Successfully Verified",
      });
    } else {
      res.status(400).json({
        message: "Nothing to verify",
      });
      return;
    }
  } catch (error) {
    console.log(error);
    loggers.info(`addNewProcurement-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.uploadInvoiceToOrder = async (req, res) => {
  try {
    const { orderData, finalAmountPaid, onlineAmount, cashAmount, comments , id} = req.body;
    const finalInvoiceAmount = orderData.totalAmount;
    const keys = [];
    const paths = [];
    let vendorId;
    if (!isEmpty(req.files)) {
      if (orderData?.items.length > 0) {
        req.files.map((ele) => {
          const key = uuid.v4();
          keys.push(key);
          const [name, type] = ele?.filename ? ele.filename.split(".") : [];
          paths.push(`nursery/procurements/${key}.${type}`);
        });
        for (let i = 0; i < orderData.items.length; i++) {
          const item = orderData?.items?.[i];
          const procHistory = await ProcurementHistory.findById(item?._id);
          procHistory.totalPrice = parseInt(item.totalPrice, 10);
          procHistory.currentPaidAmount = parseInt(item.totalPrice, 10);
          procHistory.invoice = paths[0];
          vendorId = procHistory.vendorId;
          await procHistory.save();
        }

        if (!isEmpty(req.files)) {
          req.files.map((ele, index) => {
            const [name, type] = ele.filename ? ele.filename.split(".") : [];
            uploadFile({
              file: ele,
              path: "nursery/procurements",
              key: `${keys[index]}.${type}`,
            });
          });
        }
        const currentTxnDeviation =
          parseInt(finalInvoiceAmount, 10) - parseInt(finalAmountPaid, 10);
        const vendorData = await Vendor.findById(vendorId);
        vendorData.deviation = vendorData.deviation + currentTxnDeviation;
        await vendorData.save();
        await updatePayment(vendorData, totalAmount, cashAmount, onlineAmount, comments)
        await Vendor.findOneAndUpdate({_id:new ObjectId(vendorId)}, {$push:{paymentTypes:{onlineAmount, cashAmount, comments, orderId:id, totalAmount: orderData.totalAmount, date: new Date()}}})
        
        res.status(200).json({
          message: "invoice uploaded",
        });
      } else {
        res.status(400).json({
          message: "unable to update",
        });
        return;
      }
    } else {
      res.status(422).json({
        message: "Plant Invoice is required",
      });
      return;
    }
  } catch (error) {
    console.log(error);
    loggers.info(`addNewProcurement-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const {
      status,
      vendors,
      startDate,
      endDate,
      search,
      sortBy,
      sortType,
      pageNumber,
      isCount,
    } = req.body;
    const fields = {
      admin: [
        "_id",
        "names",
        "requestedBy",
        "requestedQuantity",
        "totalPrice",
        "currentPaidAmount",
        "vendorName",
        "vendorContact",
        "quantity",
        "orderedQuantity",
        "createdAt",
        "descriptionProc",
        "expectedDeliveryDate",
        "placedBy",
        "status",
        "descriptionSales",
        "vendorId",
        "orderId",
      ],
      procurement: [
        "_id",
        "names",
        "requestedQuantity",
        "totalPrice",
        "currentPaidAmount",
        "vendorName",
        "vendorContact",
        "quantity",
        "orderedQuantity",
        "createdAt",
        "descriptionProc",
        "expectedDeliveryDate",
        "placedBy",
        "status",
        "descriptionSales",
        "invoice",
        "procurementId",
        "vendorId",
        "orderId",
      ],
      sales: [
        "_id",
        "names",
        "requestedQuantity",
        "quantity",
        "orderedQuantity",
        "createdAt",
        "descriptionProc",
        "expectedDeliveryDate",
        "status",
        "descriptionSales",
      ],
    };
    const role = req?.token?.role;
    const matchQuery = {};

    if (!isEmpty(status)) {
      matchQuery.status = { $in: status };
    }

    if (!isEmpty(vendors)) {
      matchQuery.vendorId = { $in: vendors };
    }

    if (startDate != null && endDate != null) {
      matchQuery.createdAt = {
        $gte: dayjs(startDate, "YYYY-MM-DD").toDate(),
        $lt: dayjs(endDate, "YYYY-MM-DD").add(1, "day").toDate(),
      };
    }
    if (search) {
      if (parseInt(search, 10) > 0) {
        matchQuery["$expr"] = {
          $regexMatch: {
            input: { $toString: "$orderId" },
            regex: search,
          },
        };
      } else {
        matchQuery["names.en.name"] = { $regex: search, $options: "i" };
      }
    }
    const matchPipe = [
      {
        $match: {
          ...matchQuery,
        },
      },
    ];
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
    const sortVal = {
      plantName: "names.en.name",
      createdAt: "createdAt",
    };
    const sortStage = [
      {
        $sort: {
          [sortVal[sortBy]]: parseInt(sortType),
        },
      },
    ];
    const pipeline = [];
    pipeline.push(...matchPipe);
    if (sortBy && sortType) {
      pipeline.push(...sortStage);
    }
    if (isCount) {
      pipeline.push(...count);
    } else {
      let projectFields = fields[role];
      if (projectFields) {
        const project = {};
        projectFields.forEach((f) => (project[f] = 1));
        pipeline.push({ $project: project });
      }
    }
    if (pageNumber) {
      pipeline.push(...pagination);
    }
    console.log("getAllOrders-pipeline", JSON.stringify(pipeline));
    const orders = await ProcurementHistory.aggregate(pipeline);
    res.json(orders);
  } catch (error) {
    console.log(error);
    loggers.info(`getAllProcurementsHistory-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.updateDeliveryDate = async (req, res) => {
  const { id, expectedDeliveryDate } = req.body;
  const procHistory = await ProcurementHistory.findOne({
    _id: new mongoose.mongo.ObjectId(id),
    status: "PLACED",
  });
  if (procHistory) {
    procHistory.expectedDeliveryDate = dayjs(
      expectedDeliveryDate,
      "YYYY-MM-DD"
    );
    res.status(200).json({
      message: "Successfully Updated date",
    });
  } else {
    res.status(400).json({
      message: "Unable to update",
    });
  }
};

exports.getAllProcurements = async (req, res) => {
  const fields = {
    admin: [
      "_id",
      "names",
      "remainingQuantity",
      "underMaintenanceQuantity",
      "lastProcuredOn",
      "procurementHistory",
      "variants",
      "minimumQuantity",
      "categories",
    ],
    procurement: [
      "_id",
      "names",
      "remainingQuantity",
      "underMaintenanceQuantity",
      "lastProcuredOn",
      "procurementHistory",
      "categories",
      "minimumQuantity",
    ],
    sales: [
      "_id",
      "names",
      "variants",
      "categories",
      "remainingQuantity",
      "underMaintenanceQuantity",
    ],
    preSales: ["_id", "names", "variants", "categories"],
  };
  const { pageNumber, search, isCount, sortBy, sortType, isAll, isList } =
    req.body;
  try {
    const match = [
      {
        $match: {
          remainingQuantity: { $gte: 0 },
        },
      },
    ];
    const pagination = [
      {
        $skip: 10 * (pageNumber - 1),
      },
      {
        $limit: 10,
      },
    ];
    const searchMatch = [
      {
        $match: {
          $or: [
            { "names.en.name": { $regex: search, $options: "i" } },
            { "names.ka.name": { $regex: search, $options: "i" } },
          ],
        },
      },
    ];
    const count = [
      {
        $count: "count",
      },
    ];
    const sortVal = {
      plantName: "names.en.name",
      lastProcuredOn: "lastProcuredOn",
    };
    const sortStage = [
      {
        $sort: {
          [sortVal[sortBy]]: parseInt(sortType),
        },
      },
    ];

    const lookupProcHistory = [
      {
        $lookup: {
          from: "procurement_histories",
          let: { procurementId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$procurementId", "$procurementId"],
                },
                status: "VERIFIED",
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            {
              $limit: 10,
            },
          ],
          as: "procurementHistory",
        },
      },
    ];

    const pipeline = [];
    if (!isList) {
      pipeline.push(...match);
    }
    if (
      (req?.token?.role === "sales" || req?.token?.role === "preSales") &&
      isAll !== "true"
    ) {
      const salesMatch = [
        {
          $match: {
            "variants.0": { $exists: true },
          },
        },
      ];
      pipeline.push(...salesMatch);
    }
    if (search) {
      pipeline.push(...searchMatch);
    }
    if (sortBy && sortType) {
      pipeline.push(...sortStage);
    }
    if (pageNumber) {
      pipeline.push(...pagination);
    }
    if (isCount) {
      pipeline.push(...count);
    } else {
      const role = req?.token?.role;
      if (["admin", "procurement"].includes(role) && isList !== "true") {
        pipeline.push(...lookupProcHistory);
      }
      let projectFields = fields[role];
      if (projectFields) {
        const project = {};
        projectFields.forEach((f) => (project[f] = 1));
        pipeline.push({ $project: project });
      }
    }

    console.log("getAllProcurements-pipeline", JSON.stringify(pipeline));
    loggers.info(`getAllProcurements-pipeline, ${JSON.stringify(pipeline)}`);
    const procurements = await Procurement.aggregate(pipeline);
    if (count) {
      res.json(procurements);
    } else {
      const procurementsWithAvg = procurements.map((procurement) => {
        const sum = procurement?.procurementHistory?.reduce((acc, ele) => {
          return acc + ele.totalPrice / ele.quantity;
        }, 0);
        const averagePrice = (
          sum / procurement.procurementHistory.length
        ).toFixed(2);
        return { ...procurement, averagePrice };
      });
      res.json(procurementsWithAvg);
    }
  } catch (error) {
    console.log(error);
    loggers.info(`getAllProcurements-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getAllProcurementsHistory = async (req, res) => {
  const { pageNumber, isCount, id, startDate, endDate, isAverage } = req.body;
  const procurementId = new mongoose.mongo.ObjectId(id);
  const mandatory = [
    "_id",
    "createdAt",
    "quantity",
    "vendorName",
    "vendorContact",
    "totalPrice",
    "invoice",
    "images",
  ];

  try {
    const match = [
      {
        $match: {
          procurementId,
          createdAt: {
            $gte: dayjs(startDate, "YYYY-MM-DD").toDate(),
            $lt: dayjs(endDate, "YYYY-MM-DD").add(1, "day").toDate(),
          },
          status: "VERIFIED",
        },
      },
    ];
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

    const sortStage = [
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];

    const pipeline = [];
    pipeline.push(...match);
    pipeline.push(...sortStage);

    if (pageNumber) {
      pipeline.push(...pagination);
    }

    if (isCount) {
      pipeline.push(...count);
    }

    if (isAverage) {
      const averagePriceStage = {
        $group: {
          _id: "null",
          avg: {
            $avg: { $divide: ["$totalPrice", "$quantity"] },
          },
        },
      };
      pipeline.push(averagePriceStage);
    }
    if (!isCount && !isAverage) {
      const project = {};
      mandatory.forEach((f) => (project[f] = 1));
      pipeline.push({ $project: project });
    }

    console.log("getAllProcurementsHistory-pipeline", JSON.stringify(pipeline));
    const procurements = await ProcurementHistory.aggregate(pipeline);
    loggers.info(
      `getAllProcurementsHistory-pipeline, ${JSON.stringify(pipeline)}`
    );
    res.json(procurements);
  } catch (error) {
    console.log(error);
    loggers.info(`getAllProcurementsHistory-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.addProcurementVariants = async (req, res) => {
  const { id, variants } = req.body;
  try {
    const procurement = await Procurement.findById(id);
    let i = 0;
    const minMaxValidation = variants.every((ele) => {
      i++;
      return ele.minPrice < ele.maxPrice;
    });
    if (!minMaxValidation) {
      res.status(400).json({
        error: `${
          variants[i - 1]?.variantNameInEnglish
        } min price should be less than max price`,
      });
      return;
    }
    if (procurement) {
      const variantsDb = variants.map((val) => ({
        names: {
          en: {
            name: val.variantNameInEnglish,
          },
          ka: {
            name: val.variantNameInKannada,
          },
        },
        minPrice: val.minPrice,
        maxPrice: val.maxPrice,
      }));
      procurement.variants = [...variantsDb];
      const names = procurement.variants.map((val) => val.names.en);
      const uniqVal = uniq(names);
      if (names.length === uniqVal.length) {
        const response = await procurement.save();
        res.json(response);
      } else {
        res.status(400).json({ error: "duplicate variant name" });
      }
    } else {
      res.status(400).send("Record not found");
    }
  } catch (error) {
    console.log(error);
    loggers.info(`addProcurementVariants-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.setMinimumQuantity = async (req, res) => {
  const { id, minimumQuantity } = req.body;
  try {
    const procurement = await Procurement.findById(id);
    if (procurement) {
      procurement.minimumQuantity = minimumQuantity;
      const response = await procurement.save();
      res.json(response);
    } else {
      res.status(400).send("Record not found");
    }
  } catch (error) {
    console.log(error);
    loggers.info(`setMinimumQuantity-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getLowProcurements = async (req, res) => {
  const { pageNumber, isCount, sortBy, sortType, search } = req.body;
  try {
    const match = [
      {
        $match: {
          $expr: {
            $lt: ["$remainingQuantity", "$minimumQuantity"],
          },
        },
      },
    ];
    const pagination = [
      {
        $skip: 10 * (pageNumber - 1),
      },
      {
        $limit: 10,
      },
    ];
    const searchMatch = [
      {
        $match: {
          "names.en.name": { $regex: search, $options: "i" },
        },
      },
    ];
    const count = [
      {
        $count: "count",
      },
    ];
    const sortVal = {
      minimumQuantity: "minimumQuantity",
    };
    const sortStage = [
      {
        $sort: {
          [sortVal[sortBy]]: parseInt(sortType),
        },
      },
    ];

    const lookupProcHistory = [
      {
        $lookup: {
          from: "procurement_histories",
          let: { procurementId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$procurementId", "$procurementId"],
                },
                status: "VERIFIED",
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            {
              $limit: 10,
            },
          ],
          as: "procurementHistory",
        },
      },
    ];

    const pipeline = [];
    pipeline.push(...match);
    if (search) {
      pipeline.push(...searchMatch);
    }
    if (sortBy && sortType) {
      pipeline.push(...sortStage);
    }
    if (pageNumber) {
      pipeline.push(...pagination);
    }
    if (isCount) {
      pipeline.push(...count);
    } else {
      const project = {};
      const mandatory = [
        "_id",
        "names",
        "totalQuantity",
        "remainingQuantity",
        "lastProcuredOn",
        "procurementHistory",
        "underMaintenanceQuantity",
        "minimumQuantity",
      ];
      if (req.token?.role === "admin") {
        mandatory.push(...["variants"]);
      }
      mandatory.forEach((f) => (project[f] = 1));
      pipeline.push(...lookupProcHistory);
      pipeline.push({ $project: project });
    }

    console.log("getLowProcurements-pipeline", JSON.stringify(pipeline));
    loggers.info(`getLowProcurements-pipeline, ${JSON.stringify(pipeline)}`);
    const procurements = await Procurement.aggregate(pipeline);
    res.json(procurements);
  } catch (error) {
    console.log(error);
    loggers.info(`getLowProcurements-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.updateDamage = async (req, res) => {
  try {
    const { id, damagedQuantity } = req.body;
    const keys = [];
    const paths = [];
    if (!isEmpty(req.files)) {
      req.files.map((ele) => {
        const key = uuid.v4();
        keys.push(key);
        const [name, type] = ele?.filename ? ele.filename.split(".") : [];
        paths.push(`nursery/procurements/${key}.${type}`);
      });
    } else {
      res.status(422).json({
        message: "Damaged Images are required",
      });
      return;
    }

    const reportedBy = {
      _id: req?.token?.id,
      name: req?.token?.name,
    };
    const proc = await Procurement.findById(id);
    if (proc.remainingQuantity < parseInt(damagedQuantity, 10)) {
      res.status(400).json({
        error: "Count cannot be greater than Remaining Quantity",
      });
    } else {
      proc.remainingQuantity =
        proc.remainingQuantity - parseInt(damagedQuantity, 10);
      const damageHistory = {
        procurementId: proc._id,
        names: proc.names,
        reportedBy,
        damagedQuantity,
        images: paths,
      };
      const damages = await new DamageHistory(damageHistory);
      await proc.save();
      await damages.save();
      if (!isEmpty(req.files)) {
        req.files.map((ele, index) => {
          const [name, type] = ele.filename ? ele.filename.split(".") : [];
          uploadFile({
            file: ele,
            path: "nursery/procurements",
            key: `${keys[index]}.${type}`,
          });
        });
      }
      res.json({
        message: "Successfully Created",
      });
    }
  } catch (error) {
    console.log(error);
    loggers.info(`updateDamage-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getDamageList = async (req, res) => {
  try {
    const { pageNumber, isCount, startDate, endDate, search } = req.body;

    const matchQuery = {};

    if (search) {
      matchQuery["names.en.name"] = { $regex: search, $options: "i" };
    }

    if (startDate != null && endDate != null) {
      matchQuery.createdAt = {
        $gte: dayjs(startDate, "YYYY-MM-DD").toDate(),
        $lt: dayjs(endDate, "YYYY-MM-DD").add(1, "day").toDate(),
      };
    }

    const match = [
      {
        $match: matchQuery,
      },
    ];

    const sort = [
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];

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
    pipeline.push(...match);
    pipeline.push(...sort);

    if (pageNumber) {
      pipeline.push(...pagination);
    }

    if (isCount) {
      pipeline.push(...count);
    }
    console.log("getAllDamages-pipeline", JSON.stringify(pipeline));
    loggers.info(`getAllDamages-pipeline, ${JSON.stringify(pipeline)}`);
    const damages = await DamageHistory.aggregate(pipeline);
    res.json(damages);
  } catch (error) {
    console.log(error);
    loggers.info(`getAllDamages-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const { id, count } = req.body;
    const proc = await Procurement.findById(id);
    if (proc.remainingQuantity < count) {
      res.status(400).json({
        error: "Count cannot be greater than Remaining Quantity",
      });
    } else {
      proc.underMaintenanceQuantity = count;
      await proc.save();
      res.json(proc);
    }
  } catch (error) {
    console.log(error);
    loggers.info(`updateMaintenance-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getProcurementById = async (req, res) => {
  try {
    const { id } = req.body;
    const proc = await Procurement.findById(id);
    await proc.save();
    res.json(proc);
  } catch (error) {
    console.log(error);
    loggers.info(`getProcurementById-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getVendorPlacedOrders = async (req, res) => {
  try {
    const { id } = req.body;
    const matchQuery = {
      $match: {
        vendorId: id,
        status: "PLACED",
        invoice: "",
      },
    };
    const group = {
      $group: {
        _id: null,
        orders: {
          $addToSet: "$orderId",
        },
      },
    };
    const pipeline = [matchQuery, group];
    console.log("getVendorPlacedOrders-pipeline", JSON.stringify(pipeline));
    loggers.info(`getVendorPlacedOrders-pipeline, ${JSON.stringify(pipeline)}`);
    const ordersData = await ProcurementHistory.aggregate(pipeline);
    let data = [];
    if (ordersData?.[0]?.orders?.length > 0) {
      data = [...ordersData[0]?.orders];
      data.push(Math.random().toString().slice(2, 11));
    } else {
      data = [Math.random().toString().slice(2, 11)];
    }
    res.json(data);
  } catch (error) {
    console.log(error);
    loggers.info(`getProcurementById-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getOrderIdDetails = async (req, res) => {
  try {
    const { id, page } = req.body;
    let statusFilter = [];
    if (page === "orders") {
      statusFilter = ["PLACED", "VERIFIED"];
    } else if (page === "placeOrder") {
      statusFilter = ["PLACED"];
    }
    const matchQuery = {
      $match: {
        orderId: parseInt(id, 10),
        status: { $in: statusFilter },
      },
    };
    const fields = [
      "orderedQuantity",
      "currentPaidAmount",
      "names",
      "totalPrice",
      "expectedDeliveryDate",
      "_id",
    ];
    const project = {};
    fields.forEach((ele) => (project[ele] = 1));
    const projrctQuery = { $project: project };
    const pipeline = [matchQuery, projrctQuery];
    console.log("getOrderIdDetails-pipeline", JSON.stringify(pipeline));
    loggers.info(`getOrderIdDetails-pipeline, ${JSON.stringify(pipeline)}`);
    const ordersData = await ProcurementHistory.aggregate(pipeline);
    let totalAmount = 0;
    let advanceAmount = 0;

    for (let i = 0; i < ordersData.length; i++) {
      const ele = ordersData[i];
      totalAmount += ele?.totalPrice;
      advanceAmount += ele?.currentPaidAmount;
    }
    res.json({
      items: ordersData,
      totalAmount,
      advanceAmount,
      expectedDeliveryDate: ordersData?.[0]?.expectedDeliveryDate,
    });
  } catch (error) {
    console.log(error);
    loggers.info(`getOrderIdDetails-error, ${JSON.stringify(error)}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

const updatePayment =async(vendor, amount, cashAmount, onlineAmount, comment)=>{
  let type = "CASH"
  if(cashAmount>0 && onlineAmount>0){
    type = 'BOTH'
  }else if (onlineAmount>0){
    type="ONLINE"
  }
  const payment = new Payment({vendorId: vendor._id, name: vendor?.name, amount, cashAmount, onlineAmount, type:'VENDORS', phoneNumber: vendor.contact, comment, transferType: type})
  await payment.save()
  const capital = await Tracker.findOne({name: 'capital'});
  capital.number = capital.number - amount
}