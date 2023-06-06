// const lodash = require('lodash')
const Vendor = require('../models/vendor.model')
const AgriOrders = require("../models/agriOrderMgmt.model");

exports.requestAgriOrder = async (req, res) => {
    const { orders, descrption } = req.body
    const requestedBy = {
        _id: req?.token?.id,
        name: req?.token?.name
    }
    const orderPromises = orders.map(order => {
        const { totalQuantity, type, name, variant } = order
        let variantName = `${type}-${name}`;
        const variantAttributes = variant.map(v => v.optionValue)
        variantName = `${variantName}(${variantAttributes.join(' ')})`
        const orderData = new AgriOrders({ names: variantName, requestedQuantity: totalQuantity, requestedBy, descriptionSales: descrption, variant, status: "REQUESTED" })
        return orderData.save()
    });
    await Promise.all(orderPromises)
    res.send({
        message: 'Order Placed Succesfully'
    })
}

exports.placeAgriOrder = async (req, res) => {
    const { orders, descrption, currentPaidAmount, orderId, vendorName, vendorContact, expectedDeliveryDate, vendorId } = req.body
    let newVendorId
    if (!vendorId) {
        const vendorData = new Vendor({ contact: vendorContact, name: vendorName })
        newVendorId = vendorData._id
        vendorData.save()
    }
    const placedBy = {
        _id: req?.token?.id,
        name: req?.token?.name
    }

    for (let i = 0; i < orders.length; i++) {
        const { totalQuantity, type, name, variant, id, totalPrice } = orders[i]
        if (id) {
            const data = await AgriOrders.findById(id);
            if (data) {
                data.orderedQuantity = totalQuantity
                data.placedBy = placedBy
                data.vendorName = vendorName,
                    data.vendorContact = vendorContact,
                    data.vendorId = vendorId || newVendorId,
                    data.status = 'PLACED',
                    data.orderId = orderId
                data.expectedDeliveryDate = dayjs(expectedDeliveryDate, 'YYYY-MM-DD'),
                    data.currentPaidAmount = currentPaidAmount
                data.totalPrice = totalPrice
                await data.save()
            }
        } else {
            let variantName = `${type}-${name}`;
            const variantAttributes = variant.map(v => v.optionValue)
            variantName = `${variantName}(${variantAttributes.join(' ')})`
            const orderData = new AgriOrders(
                {
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
                    totalPrice
                })
           await orderData.save()
        }
    }
    res.send({
        message: 'Order Placed Succesfully'
    })


}