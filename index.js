const express = require('express');
const router = require('./api/route')
const bodyParser = require('body-parser');
const dotenv = require('dotenv')
const dbCon = require('./db/connection')
const cookieParser = require("cookie-parser");
const cors = require('cors')
const compression = require('compression')
const helmet = require('helmet')
const app = express();
const logger = require('./loggers')
app.use(compression())
app.use(helmet())
dotenv.config({ path: './.env' })
dbCon.connect()
const port = process.env.PORT;
console.log(process.env.ENV)
if(process.env.ENV==='dev' || process.env.ENV==='qa'){
    app.use(cors())
}
app.use(cookieParser())
app.use(bodyParser.json({ limit: '1mb' }))
app.use(router)
// app.get("/", function (req, res) {
//     res.sendFile(__dirname + "/index.html");
// });
const server = app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
    logger.info(`Server is running on port ${port}`)
})
server.setTimeout(5000)

/* 
Order table 
admin view
proc reject, edit dates, sales desc, 
sales: verify, procure des
edit date api for proc

*/

/*
TODO 

Excel break down (online cash)  (1) 10min done
Backend price reset in agri (1)  30
Excel download all roles (1)  10  2 min (done)


Add invoice comments (for procurement) (cash + online)  2
vendor listing apis (with deviations as filter)  30  2

Payment
Name, Phonenumber Acc number IFSC code bank name, mode of payment (online cash both) comment for others  4
Payment Date filter, total payments 10


Procurement alphabetical sorting
Reverse GST for AGRI

*/