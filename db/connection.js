// for db connection
const mongoose = require('mongoose')
//const uri = "mongodb+srv://admin:admin123@cluster0.t2cxv.mongodb.net/test?authSource=admin&replicaSet=atlas-11m572-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true";

const connect = mongoose.connect("mongodb+srv://admin:admin123@cluster0.t2cxv.mongodb.net/patient_mgmt?retryWrites=true&w=majority",{
	useNewUrlParser: true,
	useUnifiedTopology: true,
	

}).then(() => console.log("Database connected!"))
.catch(err => console.log(err));

module.exports = connect;