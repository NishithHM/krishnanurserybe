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
const logger = require('./loggers');
const { takeScreenshot, uploadToS3, rcb } = require('./scripts/rcb');
const { rcbCron } = require('./crons/rcb.cron');
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
const server = app.listen(port, async() => {
    // rcbCron()
    rcb()
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


Reverse GST for AGRI

*/