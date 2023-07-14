const { isEmpty } = require("lodash");
const AgriProcurementModel = require("../models/AgriProcurement.model");
const { handleMongoError } = require("../utils");


exports.getAgriItemDetails = async (req, res) => {
      try {
            const { variant, type, name } = req.body
            let variantName = `${type}-${name}`;
            const variantAttributes = variant.map((v) => v.optionValue);
            variantName = `${variantName}(${variantAttributes.join(" ")})`;
            const agriProc = await AgriProcurementModel.findOne({ type, names: variantName }, { maxPrice: 1, minPrice: 1, remainingQuantity: 1 })
            if (isEmpty(agriProc)) {
                  res.status(404).json({
                        message: `${variantName} not found, please contact admin`
                  })
            } else {
                  res.status(200).json({
                        ...agriProc._doc
                  })
            }
      } catch (error) {
            console.log(error)
            loggers.info(`getAgriItemDetails-error, ${error}`)
            const err = handleMongoError(error)
            res.status(500).send(err)
      }


}