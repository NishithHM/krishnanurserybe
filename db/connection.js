// for db connection
const mongoose = require('mongoose')


exports.connect = () => {
    const env = process.env.ENV;
    const db = process.env.DB;
    mongoose.connect(`${db}/nursery_mgmt_${env}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    
    }).then(() => console.log("Database connected! "))
        .catch(err => console.log(err));
}



