const fs = require('fs')

exports.handleMongoError = (error) => {
    console.log(JSON.parse(JSON.stringify(error)))

    if (error?.code === 11000) {
        const errors = []
        const keys = Object.keys(error?.keyPattern)
        console.log(keys)
        keys.map(k => {
            if (error?.keyValue[k]) {
                errors.push(`${k} ${error?.keyValue[k]} is already registered`)
            }
        })
        if (errors.length === 0) {
            errors.push('Something went wrong')
        }
        return { error: errors.join(',') }

    } else {
        const keys = Object.keys(error?.errors)
        if (keys.length) {
            const errors = []
            console.log(keys)
            keys.map(k => {
                if (error?.errors[k]?.kind === 'required') {
                    errors.push(`${error?.errors[k]?.message}`)
                }
            })
            if (errors.length === 0) {
                errors.push('Something went wrong')
            }
            return { error: errors.join(',') }
        }


        return { error: '' }
    }
}

exports.uploadFile = async ({ file, path }) => {
    const AWS = require('aws-sdk')
    const s3 = new AWS.S3()
    const fileStream = fs.createReadStream(file.path)
    const uploadParams = {
        Bucket: `coden-aws-bucket/${process.env.ENV}/${path}`,
        Key: file.filename,
        Body: fileStream
    }
    try {
        const res = await s3.putObject(uploadParams).promise()
        console.log(JSON.stringify(res))
        return res;
    } catch (error) {
        console.error(error, error.stack);

    } finally {
        fs.unlinkSync(file.path)
    }
}

