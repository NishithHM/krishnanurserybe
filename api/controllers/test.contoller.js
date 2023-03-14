const { uploadFile } = require('../utils')
const fs = require('fs')

exports.testUpload=async(req, res)=>{
    await uploadFile({file:req.file, bucketName:'coden-aws-bucket'})
    res.sendStatus(200)
}

exports.videoRender= async (req, res)=> {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
  
    const AWS = require('aws-sdk')
    const s3 = new AWS.S3()

    const videoStream = s3.getObject({
        Bucket:"coden-aws-bucket",
        Key:"prewedding_low.mp4"
    }).createReadStream()
    videoStream.pipe(res);
};