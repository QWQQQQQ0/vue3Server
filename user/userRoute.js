const db = require("../db/userdata")
const nodemailer = require('nodemailer')
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const dbHandle = require('../util/handleDb')
const multiparty = require('multiparty')

const config = require('../util/config')
let email = {}

exports.regUser = (req, res) => {
    const userInfo = req.body
    if(!(userInfo.username.match(/^\S{3,12}\S$/)[0] === userInfo.username && userInfo.password.match(/[\w\d!@#]{1,12}/)[0] === userInfo.password)){
        return res.cc('用户名或密码含有非法字符')
    }
    const sqlStr = 'select * from user_info where username = ?'
    handle()
    async function handle (){
        await new Promise((resolve, reject) => {
            db.query(sqlStr, userInfo.username, (err, result) => {
                if (err){
                    return res.cc(err)
                }
                if (result.length > 0 || email[userInfo.username]){
                    return res.cc('用户名已被占用，请更换其他用户名')
                }
                resolve()
            })    
        })
        const transporter = nodemailer.createTransport(config.emailSendConfig)
        const identifyCode =parseInt(Math.random()*1000000)
        const data = config.data
        if (userInfo.username) {
            email[userInfo.username] = identifyCode
            setTimeout(() => {
                delete email[userInfo.username]
            },120000)
        }else {
            email[userInfo.email] = identifyCode
            setTimeout(() => {
                delete email[userInfo.email]
            },120000)
        }
        data.to = userInfo.email
        data.text = `您的验证码为${identifyCode},2分钟后过期`
        transporter.sendMail(data, (err, info) => {
                if (err) return res.cc('邮箱名非法或不存在，请重新输入' + err)
                res.send('验证码以发送至您的邮箱')
            })
    }
}


exports.login = (req, res) => {
    const userInfo = req.body
    if (userInfo.username) {
        const sql = `select * from user_info where username=?`
        db.query(sql, userInfo.username, (err, result) => {
            if (err) return res.cc(err)
            if (result.length !== 1) return res.cc('用户名不存在，请注册或重新登录')
            const compareResult = bcrypt.compareSync(userInfo.password, result[0].password)
            if (!compareResult && userInfo.password!==result[0].password) return res.cc('密码错误，请重新输入或修改密码')
            const user = {...result[0], password: '',address: '', birthday: '', state: '',power:'',email: ''}

            const tokenStr = jwt.sign(user, 'vueServer', {expiresIn: '10h'})
            result[0].password = ''
            res.send({
                code: 0,
                message: '登录成功',
                token:'Bearer ' + tokenStr,
                user:result[0]
            })
        })
    }
    else if (userInfo.email) {
        const sql = `select * from user_info where email=?`
        db.query(sql, userInfo.email, (err, result) => {
            if (err) return res.cc(err)
            if (result.length !== 1) return res.cc('邮箱不存在，是否前往注册')
            const transporter = nodemailer.createTransport(config.emailSendConfig)
            const identifyCode =parseInt(Math.random()*1000000)
            const data = config.data
            email[userInfo.email] = identifyCode
            setTimeout(() => {
                delete email[userInfo.email]
            },120000)
            data.to = userInfo.email
            data.text = `您的验证码为${identifyCode},2分钟后过期`
            transporter.sendMail(data, (err, info) => {
                if (err) return res.cc('邮箱名非法或不存在，请重新输入' + err)
                res.send('验证码以发送至您的邮箱')
            })
        })
    }
    
}

exports.loadFiles = (req, res) => {
    const form = new multiparty.Form()
    form.parse(req, (err, fileds, file) => {
        
        fs.writeFile(`./store/userText/${fileds.name}.txt`,fileds.content[0], (err) => {
            if(err) return res.cc(err)
        })
    })
    setTimeout(() => {
        res.send('ok')
    },3000)
}
exports.receiveCode = (req, res) => {
    const userInfo = req.body
    if (!email[userInfo.email] && !email[userInfo.username])return res.cc('验证码已过期')
    if ((email[userInfo.email] || email[userInfo.username]) !==parseInt(userInfo.code))return res.cc('验证码错误请重新输入')
    if (!userInfo.username) {
        const sql = `select * from user_info where email=?`
        db.query(sql, userInfo.email, (err, result) => {
            if (err) return res.cc(err)
            if (result.length !== 1) return res.cc('邮箱不存在，是否前往注册')
            const user = {...result[0], password: '', user_pic: ''}
            const tokenStr = jwt.sign(user, 'vueServer', {expiresIn: '10h'})
            result[0].password = ''
            delete email[userInfo.email]
            res.send({
                code: 0,
                message: '登录成功',
                token:'Bearer ' + tokenStr,
                user:result[0]
            })
        })
    }else {
        userInfo.password = bcrypt.hashSync(userInfo.password, 10)
        const sql = 'insert into user_info set ?'
        db.query(sql, {username: userInfo.username, password: userInfo.password, email:userInfo.email}, (err, result) => {
            if (err) return res.cc(err)
    
            if (result.affectedRows !== 1) return res.cc('注册用户失败，请稍后再试')
    
            res.send({code: 0,message: '注册成功'})
        })
    }
    
}
exports.sendArticle = (req, res) => {
    dbHandle.selectInfo(`select artId, cut_content from articals order by artId desc LiMIT ${req.query.count * 5},5`,{code:0},res)
}
// exports.receiveHtml = (req, res) => {
//     const form = new multiparty.Form()
//     form.parse(req, (err, fileds, file) => {
//         for (let i in file) {
//             let data = handleFile.handleRead(file[i][0].path)

//             data.then(resD => {
//                 handleFile.handleWrite(`./store/article/${4}_${file[i][0].fieldName}.html`,resD, res)
//                 fs.unlink(file[i][0].path, err => {
//                     if (err) res.cc(err)
//                 })
//             })
//         }
//     })
// }