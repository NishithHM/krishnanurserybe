const cron = require('node-cron')
const fs = require('fs')
const path = require('path');
exports.dailyCron =()=>{
    cron.schedule("0 0 0 * * *", ()=>{
        deleteLoggers()
    })
}

const deleteLoggers = async ()=>{
    fs.readdir(path.join(__dirname,'../loggers'), (err, files)=>{
        console.log(err)
        files.forEach(ele=>{
            console.log(ele)
            const pathVal = path.join(__dirname,`../loggers/${ele}`)
            if(ele.includes('application')){
                fs.stat( pathVal , (err, stat)=>{
                    console.log(err)
                    console.log(stat, ele)
                    if(stat){
                        const now = new Date().getTime();
                        const endTime = new Date(stat.mtime).getTime() + 86400000 * 7 * 10
                        if(now > endTime){
                            fs.unlink(pathVal, (err, del)=>{
                                console.log(del)
                            })
                        }}
                })
        }
        })
    })
}
