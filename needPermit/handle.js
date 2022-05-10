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
        if (req.query.need) {
            db.query(`select user_pic from user_info where uid=${req.user.uid} && state=0`, (err, result) => {
                if (err) return res.cc(err)
                if (result.length != 1) return res.cc('获取用户信息失败')
                data.user_pic = result[0].user_pic
                data.code = 0
                res.send(data)
        })
        }else {
            data.code = 0
            data.user_pic = req.user.user_pic
            res.send(data)
        }
}


exports.handlePic = (req, res) => {
    const form =new multiparty.Form()
    let path
    form.parse(req, (err, fileds, file) => {
        
        handle(file)
        async function handle(file) {
            for (let i in file) {
                let result = await new Promise((resolve, reject) => {
                    fs.readFile(file[i][0].path,(err, data) => {
                        resolve(data)
                        if(err)res.cc(err)
                    })
                })
                if (Object.keys(file)[0] === 'headPic'){
                    path = `./store/headPic/${req.user.uid}_${new Date().getTime()}.jpeg`
                }else{
                    path = `./store/ordinary/${req.user.uid}_${req.query.count}${file[i][0].fieldName}.jpeg`
                }
                console.log(path)
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
                        // console.log(req.user.user_pic && !(/headPic/.test(Object.keys(file)[0])))
                    })
                    if (!(Object.keys(file)[0] === 'headPic')) return res.send(body)
                    req.body['user_pic'] = body.data.url
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

    dbHandle.selectInfo(`select uid, full_content, likes from articals where artId=${req.body.artid}`, {code : 0}, res, (message) => {
        db.query(`select likes_object from user_info where uid = ${req.user.uid}`, (err, result) => {
            if (err) return res.cc(err)
            message['likes_object'] = result[0]['likes_object']
            res.send(message)
        })
    })

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
        dbHandle.selectInfo(`select username, email, address, birthday from user_info where uid=${req.user.uid} && state=0`, {code:0},res)
    }else if (req.body.email || req.body.password) {
        if(identifyCode[req.user.uid] != req.body.code) return res.cc('验证码已过期')
        delete req.body.code
        if(req.body.password) {
            req.body.password = bcrypt.hashSync(req.body.password, 10)
            req['message'] = {code:0, message: '密码更新成功'}
            dbHandle.changeInfo('user_info', 'uid', req, res)
        }else if (req.body.email) {
            db.query(`select uid from user_info where email='${req.body.email}' && state=0`, (err, result) => {
                
                if (err) return res.cc(err)
                if (result.length > 0) return res.cc('邮箱已存在，请直接登录')
                req['message'] = {code:0, message: '邮箱更新成功'}
                dbHandle.changeInfo('user_info', 'uid', req, res)
            })
            
        }
    }
    else{
        if(req.body.username!=req.user.username){
            db.query(`select uid from user_info where username='${req.body.username}' && state=0`, (err, result) => {
                if (err) return res.cc(err)
                if (result.length > 0) return res.cc('用户名已存在，请更换用户名')
                req['message'] = {message:'修改个人信息成功', code:0}
                dbHandle.changeInfo('user_info', 'uid', req, res)
            })            
            }else {
                dbHandle.changeInfo('user_info', 'uid', req, res)
            }
        
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

exports.deleteArticle = (req, res) => {
    db.query(`DELETE FROM articals WHERE (artId = ${req.query.artId})`, (err, result) => {
        if (err) return res.cc(err)
        if (result.affectedRows != 1) return res.cc('删除未成功')
        db.query(`DELETE FROM comments WHERE (artId = ${req.query.artId})`, (err, result) => {
        if (err) return res.cc(err)
        res.send({message: '删除成功', code: 0})
        })
    })
}

exports.deleteCount = (req, res) => {
    res.send()
}

exports.comment = (req, res) => {
    req.body = {...req.body, uid: req.user.uid}
    const message = {code:0,m:{...req.body}}
    message[req.user.uid] = [req.user.user_pic, req.user.username]
    req.body.comment = Buffer.from(req.body.comment)
    dbHandle.insertInfo('comments', req.body, {code:0, message}, res)
}

exports.sendComments = (req, res) => {
    const data = {}
    db.query(`select * from comments where artid = ${req.query.artid}`, (err, result) => {
        if (err) return res.cc(err)
        result.forEach(element => {
            element.comment = element.comment.toString()
        });
        data['m'] = result
        db.query(`select uid,user_pic,username from user_info where uid in (select uid from comments where artid=${req.query.artid})`, (err, result) => {
            if (err) return res.cc(err)
            for (let i of result) {
                data[i.uid] = [i.user_pic, i.username]
            }
            res.send(data)
        })
    })
}

exports.changelike = (req, res) => {
    const addData = `&${req.query.artid}=${req.user.uid}`
    if (!req.query.delete) {
        db.query(`update user_info set likes_object=concat('${addData}',likes_object) where uid=${req.user.uid}`,(err, result) => {
            if (err) res.cc(err)
            req.user['artId'] = req.query.artid
            dbHandle.changeInfo('articals','artId', req, res)
        })
    }else {
        db.query(`update user_info set likes_object=replace(likes_object,'${addData}','') where uid=${req.user.uid}`, (err, result) => {
            if (err) return res.cc(err)
            req.user['artId'] = req.query.artid
            dbHandle.changeInfo('articals', 'artId', req, res)
        })
    }
}