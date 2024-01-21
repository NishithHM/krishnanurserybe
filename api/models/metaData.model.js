const { Schema, model } = require("mongoose");

const MetaData = new Schema({ }, {
    timestamps: true,
    strict: false
});

module.exports = model("meta_values", MetaData)
