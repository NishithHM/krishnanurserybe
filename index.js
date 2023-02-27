const express = require('express');
const router = require('./api/route')
const bodyParser = require('body-parser');
const dotenv = require('dotenv')
const dbCon = require('./db/connection')
const cookieParser = require("cookie-parser");
const cors = require('cors')

const app = express()
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
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});
app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})

