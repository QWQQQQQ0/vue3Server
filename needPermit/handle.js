const db = require('../db/userdata')
const bcrypt = require("bcryptjs")
const multiparty = require("multiparty")
const fs = require("fs")
const dbHandle = require('../util/handleDb')
const handleFile = require('../util/fsHandle')
const config = require('../util/config')

exports.getInfo = (req, res) => {
    const data = req.user

    if (!req.user.user_pic) {
        db.query(`select user_pic from user_info where uid=${req.user.uid}`, (err, result) => {
            if (err) return res.cc(err)
            if (result.length != 1) return res.cc('获取用户信息失败')
            data.user_pic = `http://${config.ipAddress}:3688${result[0].user_pic}`
            data.code = 0
            res.send(data)
        })
        }else {
            data.code = 0
            data.user_pic = `http://${config.ipAddress}:3688${req.user.user_pic}`
            res.send(data)
            
        }
}

exports.handlePic = (req, res) => {
    const form =new multiparty.Form()
    let path
    form.parse(req, (err, fileds, file) => {
        handle()
        async function handle() {
            for (let i in file) {
                let result = await new Promise((resolve, reject) => {
                    fs.readFile(file[i][0].path,(err, data) => {
                        resolve(data)
                        if(err)res.cc(err)
                    })
                })
                if (/headPic/.test(Object.keys(file)[0])){
                    path = `./store/headPic/${req.user.uid}.jpeg`
                }else{
                    path = `./store/ordinary/${req.user.uid}_${file[i][0].fieldName}.jpeg`
                }
                
                await fs.writeFile(path, result, (err, data) => {
                    if (err)res.cc(err)
                    let body = {
                        "errno": 0, // 注意：值是数字，不能是字符串
                        "data": {
                            "url": `http://${config.ipAddress}:3688/api${path.replace('./store', '')}`, // 图片 src ，必须
                            "alt": "yyy", // 图片描述文字，非必须
                            "href": "zzz" // 图片的链接，非必须
                        }
                    }
                    fs.unlink(file[i][0].path, (err) => {
                        if (err) return res.send(body)
                        console.log('删除成功')
                    })
                    if (req.user.user_pic && !(/headPic/.test(Object.keys(file)[0]))) return res.send(body)
                    req.body['user_pic'] = body.data.url.replace(`http://${config.ipAddress}:3688`, '')

                    req['message'] = body

                    dbHandle.changeInfo('user_info','uid',req,res)
                    
                    
                })
            }
            
            
        }
    })
}

exports.receiveHtml = (req, res) => {
    const form = new multiparty.Form()
    let count = 0
    let body = {}
    body['uid'] = req.user.uid
    form.parse(req, (err, fileds, file) => {
        for (let i in file) {
            let data = handleFile.handleRead(file[i][0].path)
            data.then(resD => {
                body[i] = resD.toString()
                // handleFile.handleWrite(`./store/article/${req.user.uid}_${file[i][0].fieldName}.html`,resD, res)
                fs.unlink(file[i][0].path, err => {
                    if (err) res.cc(err)
                    count ++
                    if (count === 2){
                        dbHandle.insertInfo('articals', body, {message:'上传成功',code:0}, res)
                    }
                })
            })
        
        }
    })
}