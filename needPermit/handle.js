const db = require('../db/userdata')
const bcrypt = require("bcryptjs")
const multiparty = require("multiparty")
const fs = require("fs")
const dbHandle = require('../util/handleDb')

exports.getInfo = (req, res) => {
    const data = req.user
    data.code = 0
    res.send(data)
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
                            "url": `http://127.0.0.1:3688/api${path.replace('./store', '')}`, // 图片 src ，必须
                            "alt": "yyy", // 图片描述文字，非必须
                            "href": "zzz" // 图片的链接，非必须
                        }
                    }
                    fs.unlink(file[i][0].path, (err) => {
                        if (err) return res.send(body)
                        console.log('删除成功')
                    })
                    if (req.user.user_pic && !(/headPic/.test(Object.keys(file)[0]))) return res.send(body)
                    req.body['user_pic'] = body.data.url
                    req['message'] = body

                    dbHandle.changeInfo('user_info','uid',req,res)
                    
                    
                })
            }
            
            
        }
    })
}

