const fs = require('fs')

exports.handleMongoError=(error)=>{
    if(error?.code === 11000){
        const errors = []
        const keys = Object.keys(error?.keyPattern)
        keys.map(k=>{
            if(error?.keyValue[k]){
                errors.push(`${k} ${error?.keyValue[k]} is already registered`)
            }
        })
        if(errors.length===0){
            errors.push('Something went wrong')
        }
        return {error: errors.join(',')}

    }else{
        return {error: ''}
    }
}

exports.uploadFile=async({file, bucketName})=> {
    const AWS = require('aws-sdk')
    const s3 = new AWS.S3()
    const fileStream = fs.createReadStream(file.path)
    const uploadParams = {
      Bucket: bucketName,
      Key: file.filename,
      Body: fileStream
    }
    try {
       const  res = await s3.putObject(uploadParams).promise()
       console.log(JSON.stringify(res))
    } catch (error) {
        console.error(error, error.stack);
    }finally{
        fs.unlinkSync(file.path)
    }
  }
  
