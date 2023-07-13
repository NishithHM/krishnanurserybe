// const lodash = require('lodash')
const Vendor = require("../models/vendor.model");
const AgriOrders = require("../models/agriOrderMgmt.model");
const { handleMongoError, uploadFile } = require("../utils");
const { isEmpty } = require("lodash");
const loggers = require("../../loggers");
const { default: mongoose } = require("mongoose");
const AgriProcurementModel = require("../models/AgriProcurement.model");
const uuid = require("uuid");
const dayjs = require("dayjs");
exports.requestAgriOrder = async (req, res) => {
  try {
    const { orders, descrption } = req.body;
    const requestedBy = {
      _id: req?.token?.id,
      name: req?.token?.name,
    };
    const orderPromises = orders.map((order) => {
      const { totalQuantity, type, name, variant } = order;
      let variantName = `${type}-${name}`;
      const variantAttributes = variant.map((v) => v.optionValue);
      variantName = `${variantName}(${variantAttributes.join(" ")})`;
      const orderData = new AgriOrders({
        names: variantName,
        requestedQuantity: totalQuantity,
        requestedBy,
        descriptionSales: descrption,
        variant,
        status: "REQUESTED",
        type,
      });
      return orderData.save();
    });
    await Promise.all(orderPromises);
    res.send({
      message: "Order Placed Succesfully",
    });
  } catch (error) {
    console.log("agriRequest-error", JSON.stringify(error));
    loggers.info(`agriRequest-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.placeAgriOrder = async (req, res) => {
  try {
    const {
      orders,
      descrption,
      currentPaidAmount,
      orderId,
      vendorName,
      vendorContact,
      expectedDeliveryDate,
      vendorId,
    } = req.body;
    let newVendorId;
    if (!vendorId) {
      const vendorData = new Vendor({
        contact: vendorContact,
        name: vendorName,
        type: "AGRI",
      });
      newVendorId = vendorData._id;
      await vendorData.save();
    }
    const placedBy = {
      _id: req?.token?.id,
      name: req?.token?.name,
    };

    for (let i = 0; i < orders.length; i++) {
      const { totalQuantity, type, name, variant, id, totalPrice } = orders[i];
      if (id) {
        const data = await AgriOrders.findById(id);
        if (data) {
          data.orderedQuantity = totalQuantity;
          data.placedBy = placedBy;
          (data.vendorName = vendorName),
            (data.vendorContact = vendorContact),
            (data.vendorId = vendorId || newVendorId),
            (data.status = "PLACED"),
            (data.orderId = orderId);
          data.expectedDeliveryDate = dayjs(expectedDeliveryDate, "YYYY-MM-DD");
          if (i === 0) {
            data.currentPaidAmount = currentPaidAmount;
          }
          data.totalPrice = totalPrice;
          await data.save();
        }
      } else {
        let variantName = `${type}-${name}`;
        const variantAttributes = variant.map((v) => v.optionValue);
        variantName = `${variantName}(${variantAttributes.join(" ")})`;
        const orderData = new AgriOrders({
          names: variantName,
          requestedQuantity: totalQuantity,
          requestedBy: placedBy,
          descriptionSales: descrption,
          variant,
          status: "PLACED",
          orderedQuantity: totalQuantity,
          placedBy,
          vendorName,
          vendorContact,
          vendorId: vendorId || newVendorId,
          orderId,
          expectedDeliveryDate,
          totalPrice,
          type,
          currentPaidAmount: i === 0 ? currentPaidAmount : 0,
        });
        await orderData.save();
      }
    }
    res.send({
      message: "Order Placed Succesfully",
    });
  } catch (error) {
    console.log(`agriOrderPlace-error, ${JSON.stringify(error)}`);
    loggers.info(`agriOrderPlace-error, ${JSON.stringify(error)}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.agriOrderList = async (req, res) => {
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
        "variant",
        "type",
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
        "variant",
        "type",
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
        "variant",
        "type",
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
        matchQuery["names"] = { $regex: search, $options: "i" };
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
      names: "names",
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
    console.log("agriOrderList-pipeline", JSON.stringify(pipeline));
    const orders = await AgriOrders.aggregate(pipeline);
    loggers.info(`agriOrderList-pipeline, ${JSON.stringify(pipeline)}`);
    res.json(orders);
  } catch (error) {
    console.log(`agriOrderList-error, ${JSON.stringify(error)}`);
    loggers.info(`agriOrderList-error, ${JSON.stringify(error)}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.verifyAgriOrder = async (req, res) => {
  try {
    const { id, quantity } = req.body;
    const keys = [];
    const paths = [];
    if (!isEmpty(req.files)) {
      req.files.map((ele) => {
        const key = uuid.v4();
        keys.push(key);
        const [name, type] = ele?.filename ? ele.filename.split(".") : [];
        paths.push(`agri/procurements/${key}.${type}`);
      });
    } else {
      res.status(422).json({
        message: "Agri Images are required",
      });
      return;
    }
    const order = await AgriOrders.findOne({
      _id: new mongoose.mongo.ObjectId(id),
      status: "PLACED",
    });
    if (order) {
      order.status = "VERIFIED";
      order.quantity = quantity;
      order.images = paths;
      const agriProc = await AgriProcurementModel.findOne({
        names: order.names,
      });
      if (!isEmpty(agriProc)) {
        agriProc.remainingQuantity = agriProc.remainingQuantity + quantity;
        agriProc.lastProcuredOn = new Date();
        await agriProc.save();
      } else {
        const newAgriProc = new AgriProcurementModel({
          names: order.names,
          type: order.type,
          remainingQuantity: quantity,
          lastProcuredOn: new Date(),
        });
        await newAgriProc.save();
      }
      if (!isEmpty(req.files)) {
        req.files.map((ele, index) => {
          const [name, type] = ele.filename ? ele.filename.split(".") : [];
          uploadFile({
            file: ele,
            path: "agri/procurements",
            key: `${keys[index]}.${type}`,
          });
        });
      }
      await order.save();
      res.status(200).json({
        message: "Successfully Verified",
      });
    } else {
      res.status(404).json({
        message: "Order Not Found",
      });
    }
  } catch (error) {
    console.log(error);
    console.log(`verifyAgriOrder-error, ${JSON.stringify(error)}`);
    loggers.info(`verifyAgriOrder-error, ${JSON.stringify(error)}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getAllAgriProcurements = async (req, res) => {
  const fields = {
    admin: [
      "_id",
      "names",
      "remainingQuantity",
      "lastProcuredOn",
      "procurementHistory",
      "minimumQuantity",
      "type",
      "minPrice",
      "maxPrice",
    ],
    procurement: [
      "_id",
      "names",
      "remainingQuantity",
      "lastProcuredOn",
      "procurementHistory",
      "type",
      "minimumQuantity",
    ],
  };
  const { pageNumber, search, isCount, sortBy, sortType, onlyLow } = req.body;
  console.log(onlyLow);
  try {
    const match = [
      {
        $match: {
          remainingQuantity: { $gte: 0 },
        },
      },
    ];

    const lowMatch = [
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
          names: { $regex: search, $options: "i" },
        },
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
          [sortBy]: parseInt(sortType),
        },
      },
    ];

    const lookupProcHistory = [
      {
        $lookup: {
          from: "agri_orders",
          let: { names: "$names" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$names", "$names"],
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
    if (onlyLow) {
      pipeline.push(...lowMatch);
    }
    if (isCount) {
      pipeline.push(...count);
    } else {
      const role = req?.token?.role;
      pipeline.push(...lookupProcHistory);
      let projectFields = fields[role];
      if (projectFields) {
        const project = {};
        projectFields.forEach((f) => (project[f] = 1));
        pipeline.push({ $project: project });
      }
    }

    console.log("getAllAgriProcurements-pipeline", JSON.stringify(pipeline));
    loggers.info(
      `getAllAgriProcurements-pipeline, ${JSON.stringify(pipeline)}`
    );
    const procurements = await AgriProcurementModel.aggregate(pipeline);
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
    loggers.info(`getAllAgriProcurements-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getAllAgriProcurementsHistory = async (req, res) => {
  const { pageNumber, isCount, name, startDate, endDate, isAverage } = req.body;
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
          names: name,
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

    console.log(
      "getAllAgriProcurementsHistory-pipeline",
      JSON.stringify(pipeline)
    );
    const procurements = await AgriOrders.aggregate(pipeline);
    loggers.info(
      `getAllAgriProcurementsHistory-pipeline, ${JSON.stringify(pipeline)}`
    );
    res.json(procurements);
  } catch (error) {
    console.log(error);
    loggers.info(`getAllAgriProcurementsHistory-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.agriSetAmounts = async (req, res) => {
  const { id, minimumQuantity, minPrice, maxPrice } = req.body;

  try {
    if (minPrice > maxPrice) {
      res.status(400).json({
        message: "min Price greater than max price",
      });
    }

    const agriProc = await AgriProcurementModel.findById(id);
    agriProc.maxPrice = maxPrice;
    agriProc.minPrice = minPrice;
    agriProc.minimumQuantity = minimumQuantity;
    await agriProc.save();

    res.status(200).json({
      message: "Saved Successfully",
    });
  } catch (error) {
    console.log(error);
    loggers.info(`getAllAgriProcurements-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.uploadInvoiceToAgriOrder = async (req, res) => {
  try {
    const { orderData, finalAmountPaid } = req.body;
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
          paths.push(`agri/procurements/${key}.${type}`);
        });
        for (let i = 0; i < orderData.items.length; i++) {
          const item = orderData?.items?.[i];
          const procHistory = await AgriOrders.findById(item?._id);
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
              path: "agri/procurements",
              key: `${keys[index]}.${type}`,
            });
          });
        }
        const currentTxnDeviation =
          parseInt(finalInvoiceAmount, 10) - parseInt(finalAmountPaid, 10);
        const vendorData = await Vendor.findById(vendorId);
        vendorData.deviation = vendorData.deviation + currentTxnDeviation;
        vendorData.save();
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
    loggers.info(`uploadInvoiceToAgriOrder-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getAgriOrderIdDetails = async (req, res) => {
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
    console.log("getAgriOrderIdDetails-pipeline", JSON.stringify(pipeline));
    loggers.info(`getAgriOrderIdDetails-pipeline, ${JSON.stringify(pipeline)}`);
    const ordersData = await AgriOrders.aggregate(pipeline);
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
    loggers.info(`getAgriOrderIdDetails-error, ${JSON.stringify(error)}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.getAgriVendorPlacedOrders = async (req, res) => {
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
    console.log("getAgriVendorPlacedOrders-pipeline", JSON.stringify(pipeline));
    loggers.info(
      `getAgriVendorPlacedOrders-pipeline, ${JSON.stringify(pipeline)}`
    );
    const ordersData = await AgriOrders.aggregate(pipeline);
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
    loggers.info(`getAgriVendorPlacedOrders-error, ${error}`);
    const err = handleMongoError(error);
    res.status(500).send(err);
  }
};

exports.rejectAgriOrderRequest = async (req, res) => {
  const { id, description } = req.body;
  const procHistory = await AgriOrders.findOne({
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
