const fs = require("fs");
const { txnData, baseFileData, baseLedgerData, ledgerDate, ledgerData } = require("../controllers/paymentXMLTemplate");

exports.handleMongoError = (error) => {
  console.log(JSON.parse(JSON.stringify(error)));

  if (error?.code === 11000) {
    const errors = [];
    const keys = Object.keys(error?.keyPattern);
    console.log(keys);
    keys.map((k) => {
      if (error?.keyValue[k]) {
        errors.push(`${k} ${error?.keyValue[k]} is already registered`);
      }
    });
    if (errors.length === 0) {
      errors.push("Something went wrong");
    }
    return { error: errors.join(",") };
  } else {
    const keys = Object.keys(error?.errors);
    if (keys.length) {
      const errors = [];
      console.log(keys);
      keys.map((k) => {
        if (error?.errors[k]?.kind === "required") {
          errors.push(`${error?.errors[k]?.message}`);
        }
      });
      if (errors.length === 0) {
        errors.push("Something went wrong");
      }
      return { error: errors.join(",") };
    }

    return { error: "" };
  }
};

exports.uploadFile = async ({ file, path, key }) => {
  const AWS = require("aws-sdk");
  const s3 = new AWS.S3();
  const fileStream = fs.createReadStream(file.path);
  const uploadParams = {
    Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.ENV}/${path}`,
    Key: key,
    Body: fileStream,
  };
  try {
    const res = await s3.putObject(uploadParams).promise();
    console.log(JSON.stringify(res));
    return res;
  } catch (error) {
    console.error(error, error.stack);
  } finally {
    fs.unlinkSync(file.path);
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { path } = req.body;
    const AWS = require("aws-sdk");
    const s3 = new AWS.S3();
    const bucket = process.env.AWS_BUCKET_NAME;
    const fileKey = `${process.env.ENV}/${path}`;
    console.log(fileKey);
    const fileStream = s3
      .getObject({ Bucket: bucket, Key: fileKey })
      .createReadStream()
      .on("error", () =>
        res.status(400).send({ error: "Unable to download file" })
      );
    res.attachment(fileKey);
    fileStream.pipe(res);
  } catch (e) {
    res.status(500);
  }
};

exports.uploadAwsTest = async (req, res) => {
  try {
    const AWS = require("aws-sdk");
    const s3 = new AWS.S3();
    //s3 presigned url
    res.send(`nursery/test`);
  } catch (e) {
    res.status(500);
  }
};

exports.escapeRegex=(input)=> {
  return input?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special regex characters
}
exports.createXML = async (data)=>{
    const txtInput = data.map(({customerName, customerNumber, billedDate, paymentType, items, totalPrice, roundOff}, index)=> txnData({customerName, customerNumber, billedDate, paymentType, items, totalPrice, index: index+1, roundOff}))
    const fullXML = baseFileData(txtInput)
    // console.log(fullXML)
    const xmlPath = 'api/controllers/billing_xml.xml'
    return new Promise((res, rej)=>{
      fs.writeFile(xmlPath, fullXML, (err) => {
        if (err) {
          console.error('Error writing XML to file:', err);
          rej(err)
        } else {
          console.log('XML file has been saved successfully.');
          res(xmlPath)
        }
      });
    })
    
}

exports.createLegderXML = async (data)=>{
  const txtInput = data.map(({name}, index)=> ledgerData({customerName:name}))
  const fullXML = baseLedgerData(txtInput)
  // console.log(fullXML)
  const xmlPath = 'api/controllers/ledger_xml.xml'
  return new Promise((res, rej)=>{
    fs.writeFile(xmlPath, fullXML, (err) => {
      if (err) {
        console.error('Error writing XML to file:', err);
        rej(err)
      } else {
        console.log('XML file has been saved successfully.');
        res(xmlPath)
      }
    });
  })
  
}
