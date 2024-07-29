const mongoose = require("mongoose");
const payments = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
    },
    invoiceId: {
      type: String,
      unique: true,
    },
    amount: {
      type: Number,
    },
    type: {
      type: String,
      enum: ["BROKER", "SALARY", "OTHERS", "VENDOR", "CAPITAL"],
    },
    transferType:{
        type: String,
        enum: ["CASH", "ONLINE", "BOTH"],
    },
    phoneNumber:{
      type: String,
    },
    accountNumber:{
      type: String,
    },
    ifscCode:{
      type: String,
    },
    bankName:{
      type: String,
    },
    comment:{
      type: String
    },
    cashAmount:{
      type: Number,
      default: 0
    },
    onlineAmount:{
      type: Number,
      default: 0
    },
    brokerId: {
      type: String,
      default: null,
    },
    vendorId:{
      type: String,
      default: null,
    },
    businessType:{
      type: String,
      enum: ["AGRI", "NURSERY"],
      required: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("payments", payments);
