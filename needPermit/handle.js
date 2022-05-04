const db = require('../db/userdata')
const bcrypt = require("bcryptjs")
const multiparty = require("multiparty")
const fs = require("fs")
const dbHandle = require('../util/handleDb')
const handleFile = require('../util/fsHandle')
const config = require('../util/config')
const nodemailer = require('nodemailer')
const identifyCode = {}

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
                if (i === 'cut_content'){
                    body[i] = resD.toString()
                }else{
                    body[i] = resD
                }
                fs.unlink(file[i][0].path, err => {
                    if (err) res.cc(err)
                    count ++
                    if (count === 2){
                        if (req.query.artid) {
                            req.body = body
                            req.user['artId'] =parseInt(req.query.artid)
                            req['message'] = {message:'修改成功', code:0}
                            dbHandle.changeInfo('articals', 'artId', req, res)
                        }else {
                            dbHandle.insertInfo('articals', body, {message:'上传成功',code:0}, res)
                        }

                    }
                })
            })
        }
    })
}
exports.sendFullContent = (req, res) => {
    dbHandle.selectInfo(`select uid, full_content from articals where artId=${req.body.artid}`, {code : 0}, res)

}
exports.sendUserArtical = (req, res) => {
    dbHandle.selectInfo(`select artId, cut_content from articals where uid=${req.user.uid} order by artId desc`, {code:0}, res)
}


exports.testBy = (req, res) => {
    const form = new multiparty.Form()
    let count = 0
    let body = {}
    body['uid'] = req.user.uid
    form.parse(req, (err, fileds, file) => {
        for (let i in file) {
            let data = handleFile.handleRead(file[i][0].path)
            data.then(resD => {
                body['file_address'] = resD
                // handleFile.handleWrite(`./store/article/${req.user.uid}_${file[i][0].fieldName}.html`,resD, res)
                fs.unlink(file[i][0].path, err => {
                    if (err) res.cc(err)
                    count ++
                    if (count === 2){

                        db.query('update articals set ? where artId=51', body,(err, result) => {
                            if (err) return res.cc(err)
                            res.send('ok')
                        })
                    }
                })
            })
        }
    })
}
exports.modifyInfo = (req, res) => {
    if(Object.keys(req.body).length === 0) {
        dbHandle.selectInfo(`select username, email, address, birthday from user_info where uid=${req.user.uid}`, {code:0},res)
    }else if (req.body.email || req.body.password) {
        if(!identifyCode[req.user.uid] ) return res.cc('验证码已过期')
        if(req.body.password) {
            req.body.password = bcrypt.
        }
    }
    else{
        req['message'] = {message:'修改个人信息成功', code:0}
        dbHandle.changeInfo('user_info', 'uid', req, res)
    }
}

exports.sendIdentifyCode = (req, res) => {
    const transporter = nodemailer.createTransport(config.emailSendConfig)
    const Code =parseInt(Math.random()*1000000)
    identifyCode[req.user.uid] = Code
    setTimeout(() => {
        delete identifyCode[req.user.uid]
    }, 120000);
    const data = config.data
    data.to = req.body.email
    data.text = `您的验证码为${Code},2分钟后过期`
    transporter.sendMail(data, (err, info) => {
        if (err) return res.cc('邮箱名非法或不存在，请重新输入' + err)
        res.send('验证码以发送至您的邮箱')
    })
}
