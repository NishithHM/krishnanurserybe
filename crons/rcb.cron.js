const dotenv = require('dotenv')
const cron = require('node-cron')

const { rcb } = require('../scripts/rcb')

function isNight() {
    const now = new Date();
    const hours = now.getHours(); // Get current hour in 24-hour format

    return (hours >= 15 || hours < 4); // 8 PM (20:00) to 9 AM (09:00)
}

console.log(isNight()); 

exports.rcbCron = () => {
  cron.schedule("*/15 * * * *", () => {
    console.log('running')
    if(!isNight()){
        rcb()
    }
  })
}