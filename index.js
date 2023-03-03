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
if(process.env.ENV==='dev'){
    app.use(cors())
}
app.use(cookieParser())
app.use(bodyParser.json({ limit: '1mb' }))
app.use(router)
const server = app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
    logger.info("Server Sent A Hello World!");
})
server.setTimeout(5000)

