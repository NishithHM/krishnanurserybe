const express = require('express');
const router = require('./api/route')
const bodyParser = require('body-parser');
const cors = require('cors')
const dotenv = require('dotenv')
const dbCon = require('./db/connection')
const app = express()
dotenv.config({ path: './.env' })
const port = process.env.PORT;
app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(router)
app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})
