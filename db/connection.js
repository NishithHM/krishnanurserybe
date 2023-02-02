// for db connection
const mongoose = require('mongoose')


exports.connect = () => {
    const env = process.env.ENV;
    mongoose.connect(`mongodb+srv://admin:admin123@cluster0.t2cxv.mongodb.net/nursery_mgmt_${env}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => console.log("Database connected!"))
        .catch(err => console.log(err));
}



