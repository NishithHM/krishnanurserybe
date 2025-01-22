const dayjs = require("dayjs")
const billingsModel = require("../models/billings.model")
const ExcelJS = require('exceljs');
const damageHistoryModel = require("../models/damageHistory.model");
const procurementHistoryModel = require("../models/procurementHistory.model");
const paymentModel = require("../models/payment.model");

exports.downloadBillingExcel = async (req, res) => {
    const { pageNumber = 1, startDate, endDate } = req.body
    const headers = [{ name: 'Customer Name', key: 'customerName' },
    { name: 'Customer Number', key: 'customerNumber' }, 
    { name: 'item name', key: 'procurementName' }, 
    { name: 'variant name', key: 'variant' }, 
    { name: 'item rate', key: 'rate' },
    { name: 'item mrp', key: 'mrp' },
    { name: 'item quantity', key: 'quantity' }, 
    { name: 'total price', key: 'totalPrice' }, 
    { name: 'cash', key: 'cashAmount' }, 
    { name: 'online', key: 'onlineAmount' }, 
    { name: 'discount', key: 'discount' }, 
    { name: 'round off', key: 'roundOff' }, 
    { name: 'invoice id', key: 'invoiceId' }, 
    { name: 'billed date', key: 'billedDate' }, 
    { name: 'sold by', key: 'soldBy' }, 
    { name: 'billed by', key: 'billedBy' }]

    const query = {
        billedDate: {
            $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
            $lte: dayjs(endDate, 'YYYY-MM-DD').endOf('day').toDate()
        },
        status: 'BILLED',
        type: 'NURSERY'
    }
    const match = {
        $match: query
    }

    const sort = {
        $sort:{
            billedDate:1
        }
    }
    const skip = {
        $skip: (pageNumber - 1) * 1000
    }
    const limit = {
        $limit: 1000
    }

    const project = {
        $project: {
            customerName: 1,
            customerNumber: 1,
            "items.procurementName": 1,
            "items.variant": 1,
            "items.quantity": 1,
            "items.mrp": 1,
            "items.rate": 1,
            totalPrice: 1,
            discount: 1,
            roundOff: 1,
            invoiceId: 1,
            billedDate: 1,
            onlineAmount:1,
            cashAmount:1,
            "soldBy":  "$soldBy.name",
            "billedBy": "$billedBy.name",
            "_id": 0
        }
    }

    const addField = {
        $addFields:{
        items: {
          $map: {
            input: "$items",
            as: "item",
            in: {
              $mergeObjects: [
                "$$item",
                {
                  "procurementName": "$$item.procurementName.en.name",
                  "variant": "$$item.variant.en.name"
                }
              ]
            }
          }
        }
    }
  }

    const pipeline = []
    pipeline.push(match)
    pipeline.push(sort)
    pipeline.push(skip)
    pipeline.push(limit)
    pipeline.push(addField)
    pipeline.push(project)

    console.log('bills-pipeline', JSON.stringify(pipeline))

    const bills = await billingsModel.aggregate(pipeline);
    const count = await billingsModel.countDocuments(query)
    console.log(bills.length, bills[0])
    const itempSpreaded= spreadJson(bills,headers, 'items')
    await writeExcel(headers, itempSpreaded, 'billing')
    res.header("Content-Disposition",
    "attachment; filename=billing.xls");
    res.header("Access-Control-Expose-Headers", "*")
    res.header("Content-Type","application/octet-stream")
    res.header("count",count)
    res.header("isNext",(count-1000*1) > 0)
    res.sendFile('billing.xlsx', { root: __dirname });
}

exports.downloadWasteMgmtExcel = async (req, res) => {
    const { pageNumber = 1, startDate, endDate } = req.body
    
    const headers = [   { name: 'name', key: 'name' }, 
    { name: 'damage quantity', key: 'damagedQuantity' }, 
    { name: 'created date', key: 'createdAt' }, 
    { name: 'reported by', key: 'reportedBy' },
    ]

    const query = {
        createdAt: {
            $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
            $lte: dayjs(endDate, 'YYYY-MM-DD').endOf('day').toDate()
        },
    }
    const match = {
        $match: query
    }
    const skip = {
        $skip: (pageNumber - 1) * 1000
    }
    const limit = {
        $limit: 1000
    }

    const project = {
        $project: {
            "name": "$names.en.name",
            damagedQuantity: 1,
            createdAt:1,
            reportedBy:"$reportedBy.name",
            "_id": 0
        }
    }

   

    const pipeline = []
    pipeline.push(match)
    pipeline.push(skip)
    pipeline.push(limit)
    pipeline.push(project)

    console.log('damage-pipeline', JSON.stringify(pipeline))

    const damages = await damageHistoryModel.aggregate(pipeline);
    const count = await damageHistoryModel.countDocuments(query)
    console.log(damages.length,)
    await writeExcel(headers, damages, 'damages')
    res.header("Content-Disposition",
    "attachment; filename=damages.xls");
    res.header("Content-Type","application/octet-stream")
    res.header("count",count)
    res.header("isNext",(count-1000*1) > 0)
    res.header("Access-Control-Expose-Headers", "*")
    res.sendFile('damages.xlsx', { root: __dirname });
}

exports.downloadOrderMgmtExcel = async (req, res) => {
    const { pageNumber = 1, startDate, endDate } = req.body

    
    const headers = [   { name: 'name', key: 'name' }, 
    { name: 'created date', key: 'createdAt' }, 
    { name: 'requested by', key: 'requestedBy' },
    { name: 'total price', key: 'totalPrice' },
    {name: 'current paid amount', key:'currentPaidAmount'},
    {name: 'vendor name', key:'vendorName'},
    {name: 'vendor contact', key:'vendorContact'},
    {name: 'sales description', key:'descriptionSales'},
    {name: 'status', key:'status'},
    {name: 'quantity', key:'quantity'},
    {name: 'requested quantity', key:'requestedQuantity'},
    {name: 'ordered quantity', key:'orderedQuantity'},
    {name: 'proc description', key:'descriptionProc'},
    {name: 'expected delivery date', key:'expectedDeliveryDate'},
    {name: 'placed by', key:'placedBy'},
    {name: 'order id', key:'orderId'},
    ]

    const query = {
        createdAt: {
            $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
            $lte: dayjs(endDate, 'YYYY-MM-DD').endOf('day').toDate()
        },
    }
    const match = {
        $match: query
    }
    const skip = {
        $skip: (pageNumber - 1) * 1000
    }
    const limit = {
        $limit: 1000
    }

    const project = {
        $project: {
            "name": "$names.en.name",
            createdAt:1,
            requestedBy:"$requestedBy.name",
            requestedQuantity: 1,
            "totalPrice": 1,
            "currentPaidAmount": 1,
            "vendorName": 1,
            "vendorContact": 1,
            "descriptionSales": 1,
            "status": 1,
            "quantity": 1,
            "orderedQuantity": 1,
            descriptionProc: 1,
            expectedDeliveryDate:1,
            placedBy: "$placedBy.name",
            orderId:1,
            requestedQuantity:1,
            "_id": 0
        }
    }

   

    const pipeline = []
    pipeline.push(match)
    pipeline.push(skip)
    pipeline.push(limit)
    pipeline.push(project)

    console.log('order-pipeline', JSON.stringify(pipeline))

    const procs = await procurementHistoryModel.aggregate(pipeline);
    const count = await procurementHistoryModel.countDocuments(query)
    console.log(procs.length,)
    await writeExcel(headers, procs, 'orders')
    res.header("Content-Disposition",
    "attachment; filename=order.xls");
    res.header("Content-Type","application/octet-stream")
    res.header("count",count)
    res.header("isNext",(count-1000*1) > 0)
    res.header("Access-Control-Expose-Headers", "*")
    res.sendFile('orders.xlsx', { root: __dirname });
}

exports.downloadPaymentExcel = async (req, res) => {
    const { pageNumber = 1, startDate, endDate, type } = req.body

    
    const headers = [   
    { name: 'date', key: 'createdAt' }, 
        
        { name: 'name', key: 'name' }, 
        {name: 'phone number', key:'phoneNumber'},
    { name: 'amount', key: 'amount' },
    { name: 'cash amount', key: 'cashAmount' },
    {name: 'online amount', key:'onlineAmount'},
    {name: 'comments', key:'comment'},
    {name: 'type', key:'type'},
    
    ]

    const query = {
        createdAt: {
            $gte: dayjs(startDate, 'YYYY-MM-DD').toDate(),
            $lte: dayjs(endDate, 'YYYY-MM-DD').endOf('day').toDate()
        },
        type
    }
    const match = {
        $match: query
    }
    const skip = {
        $skip: (pageNumber - 1) * 1000
    }
    const limit = {
        $limit: 1000
    }

    const project = {
        $project: {
            "name": 1,
            createdAt:1,
            amount:1,
            cashAmount:1,
            onlineAmount:1,
            type:1,
            comments:1,
            phoneNumber:1
        }
    }

   

    const pipeline = []
    pipeline.push(match)
    pipeline.push(skip)
    pipeline.push(limit)
    pipeline.push(project)

    console.log('payment-pipeline', JSON.stringify(pipeline))

    const procs = await paymentModel.aggregate(pipeline);
    const count = await paymentModel.countDocuments(query)
    console.log(procs.length,)
    await writeExcel(headers, procs, 'payments')
    res.header("Content-Disposition",
    "attachment; filename=payments.xls");
    res.header("Content-Type","application/octet-stream")
    res.header("count",count)
    res.header("isNext",(count-1000*1) > 0)
    res.header("Access-Control-Expose-Headers", "*")
    res.sendFile('payments.xlsx', { root: __dirname });
}

const writeExcel = async (headers, json, name) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.columns = headers.map(ele=>{
        return {
            header: ele.name, key: ele.key, width: 20 

        }
    })

    json.forEach((data) => {
        worksheet.addRow(data);
    });
    
    // Save the workbook to a file
    await workbook.xlsx.writeFile(`${__dirname}/${name}.xlsx`)

}

const spreadJson = (json, headers,key)=>{
    const res = []
    for(let i=0; i<json.length; i++){
        const base = {...json[i]}
        const rebase= {...json[i]}
        delete rebase.items
        for(let j=0; j<base[key]?.length; j++){
            if(j===0){
                res.push({...rebase, ...base[key][j] })
            }else{
                res.push({...base[key][j] })
            }
        }
    }
    return res
}