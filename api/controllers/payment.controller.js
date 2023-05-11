const { isEmpty } = require('lodash')
const loggers = require('../../loggers')
const Broker = require('../models/broker.model')
const Payment = require('../models/payment.model')

exports.addPayment = async (req, res) => {
    try {
        const paymentData = {}
        const { brokerName, invoiceId, brokerNumber, empName, amount, type } = req.body
        const role = req?.token?.role
        let broker;
        if (brokerName) {
            broker = new Broker({ name: brokerName, contact: brokerNumber })
            paymentData.invoiceId = invoiceId
            paymentData.type = 'BROKER'
            paymentData.name = brokerName
            paymentData.contact = brokerNumber
        } else if (role !== "sales") {
            paymentData.type = type
            paymentData.name = empName
        } else {
            res.status(400).json({
                message: 'Sales cannot create'
            })
            return
        }

        paymentData.amount = amount
        const payment = new Payment({ ...paymentData })
        await payment.save()
        if (broker) {
            broker.save()
        }
        res.json({
            message: 'Successfully Created'
        })

    } catch (error) {
        console.log(error)
        loggers.info(`addPayment-error, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }
}

exports.getPaymentHistory = async (req, res) => {
    try {
        const { pageNumber, isCount, startDate, endDate, sortBy, sortType, search, type } = req.body
        const role = req?.token?.role
        let typeFilter = type
        if (role === 'sales') {
            typeFilter = 'BROKER'
        }
        const match = {}

        if (typeFilter) {
            match.type = typeFilter
        }
        if (!isCount) {
            if (startDate && endDate) {
                match.createdAt = {
                    $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
                    $lt: dayjs(endDate, 'YYYY-MM-DD').add(1, 'day').toDate()
                }
            }
            if (search) {
                match.$or = [{ name: { $regex: search, $options: "i" } }, { invoiceId: { $regex: search, $options: "i" } }, { customerNumber: search }]
            }
        }
        const pagination = [{
            '$skip': 10 * (pageNumber - 1)
        }, {
            '$limit': 10
        }]

        const count = [
            {
                '$count': 'count'
            },
        ]
        const pipeline = []

        let sortStage
        if (sortBy) {
            sortStage = [{
                '$sort': {
                    [sortBy]: parseInt(sortType)
                }
            }]
        } else {
            sortStage = [{
                '$sort': {
                    updatedAt: -1
                }
            }]
        }
        if (!isEmpty(match)) {
            const matchVal = [{ $match: { ...match } }]
            pipeline.push(...matchVal)
        }
        pipeline.push(...sortStage)
        if (pageNumber) {
            pipeline.push(...pagination)
        }

        if (isCount === 'true') {
            pipeline.push(...count)
        }
        console.log("getPaymentHistory-pipeline", JSON.stringify(pipeline))
        loggers.info(`getPaymentHistory-pipeline, ${JSON.stringify(pipeline)}`)
        const results = await Payment.aggregate(pipeline)
        if(results.length === 0 && isCount ==='true'){
            res.json([{count: 0}])
        }else{
            res.json(results)

        }
    } catch (error) {
        console.log(error)
        loggers.info(`getPaymentHistory-errr, ${error}`)
        const err = handleMongoError(error)
        res.status(500).send(err)
    }

}