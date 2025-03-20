const dotenv = require('dotenv')
const cron = require('node-cron')

const { rcb } = require('../scripts/rcb')

exports.rcbCron = () => {
  cron.schedule("*/30 * * * *", () => {
    console.log('running')
    rcb()
  })
}