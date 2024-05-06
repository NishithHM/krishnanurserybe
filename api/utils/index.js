const fs = require("fs");
const { last } = require("lodash");
const PdfMerger = require('pdf-merger-js')

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

exports.deleteFile = async ({ file, path, key }) => {
  const AWS = require("aws-sdk");
  const s3 = new AWS.S3();
  const uploadParams = {
    Bucket: `${process.env.AWS_BUCKET_NAME}/${process.env.ENV}/${path}`,
    Key: key,
  };
  try {
    const res = await s3.deleteObject(uploadParams).promise();
    console.log(JSON.stringify(res));
    return res;
  } catch (error) {
    console.error(error, error.stack);
  } finally {
    // fs.unlinkSync(file.path);
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

exports.saveFile = async (path) => {
  try {
    return new Promise((res, rej)=>{

    
    const AWS = require("aws-sdk");
    const s3 = new AWS.S3();
    const bucket = process.env.AWS_BUCKET_NAME;
    const fileKey = `${process.env.ENV}/${path}`;
    const fileName = last(path.split('/'));
    console.log(fileKey);
    
    // Download file from S3
    s3.getObject({ Bucket: bucket, Key: fileKey }, (err, data) => {
      if (err) {
        console.error('Error downloading file from S3:', err);
      } else {
        // Save file locally
        fs.writeFile(`downloads/${fileName}`, data.Body, (err) => {
          if (err) {
            console.error('Error saving file locally:', err);
          } else {
            console.log('File downloaded and saved locally successfully.');
            res()
          }
        });
      }
    }); 
  })
  } catch (e) {
    console.log(e)
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


exports.mergePdfs = async (paths)=>{
  const merger = new PdfMerger();
  for(let path of paths){
    await merger.add(`downloads/${path}`)
  }
  const buffer = await merger.saveAsBuffer()
  return buffer
}

exports.removeFiles = async (paths)=>{
  for(let path of paths){
    fs.unlinkSync(`downloads/${path}`)
  }
}
