exports.handleMongoError=(error)=>{
    console.log
    if(error?.code === 11000){
        const errors = []
        const keys = Object.keys(error?.keyPattern)
        keys.map(k=>{
            if(error?.keyValue[k]){
                errors.push(`${k} ${error?.keyValue[k]} is already registered`)
            }
        })
        return errors

    }else{
        return error
    }
}
