// const lodash = require('lodash')

const AgriOrders = require("../models/agriOrderMgmt.model");

exports.requestAgriOrder=async (req, res)=>{
    const {orders, descrption} = req.body
    console.log(orders)
    const requestedBy = {
        _id: req?.token?.id,
        name: req?.token?.name
    }
    const orderPromises = orders.map(order=>{
        const {totalQuantity, type, name, variant } = order
        let variantName = name;
        const variantAttributes = variant.map(v=> v.optionValue)
        variantName = `${variantName}_${variantAttributes.join('_')}`
        const orderData = new AgriOrders({names: variantName, requestedQuantity: totalQuantity, requestedBy, descriptionSales:descrption, variant})
        return orderData.save()
    });
    await Promise.all(orderPromises)
    res.send({
        message:'Order Placed Succesfully'
    })
}