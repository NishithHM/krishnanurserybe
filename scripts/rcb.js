const { chromium } = require('playwright');
const fs = require('fs');
const dayjs = require('dayjs');
const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const axios = require('axios')

async function takeScreenshot() {
    try {
        const browser = await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
        const page = await browser.newPage();
        await page.goto('https://shop.royalchallengers.com/ticket', { waitUntil: 'networkidle' });

        const screenshotPath = `rcb_images/${dayjs().format('DD_MM_YYYY_hh_mm')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });

        await browser.close();
        return screenshotPath;
    } catch (error) {
        console.error('Error taking screenshot:', error);
    }
}

const uploadFile = async ({ filePath }) => {
  const AWS = require("aws-sdk");
  const s3 = new AWS.S3();
  const fileStream = fs.createReadStream(filePath);
  const key = `${dayjs().format('DD_MM_YYYY_hh_mm')}.png`
  const uploadParams = {
    Bucket: `easyrevwebpublic`,
    Key: key,
    Body: fileStream,
  };
  try {
    const res = await s3.putObject(uploadParams).promise();
    console.log(JSON.stringify(res));
    return key;
  } catch (error) {
    console.error(error, error.stack);
  } finally {
    fs.unlinkSync(filePath);
  }
};

const sendMessage =(message)=>{
    const axios = require('axios');
let data = JSON.stringify({
  "phoneNumber": 9482067487,
  "message": message
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://api.easy-revv.com/api/send-whatsapp',
  headers: { 
    'authorization': '67ytgchbnuhgnbvsd', 
    'Content-Type': 'application/json'
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});

}


exports.rcb=async()=>{
    const screenshotPath = await takeScreenshot();
    const key = await uploadFile({filePath:screenshotPath})
    const message = `https://easyrevwebpublic.s3.ap-south-1.amazonaws.com/${key}`
    sendMessage(message)


    
}
