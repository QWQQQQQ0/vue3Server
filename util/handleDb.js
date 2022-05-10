const db = require('../db/userdata')

exports.changeInfo = (base,idKey,req,res) => {
    db.query(`update ${base} set ? where ${idKey}=?`, [req.body, req.user[idKey]], (err, result) => {

        if (err) return res.cc(err)
        // if (err) return console.log(err)
        // console.log(req.body,req.user[idKey])
        if (result.affectedRows !== 1) return res.cc('更新用户信息失败')
        
        // if (result.affectedRows !== 1) return console.log('更新用户信息失败')
        res.send(req.message)
    })
}
exports.insertInfo = (base, info, message,res) => {
    db.query(`insert into ${base} set ?`, info, (err, result) => {
        if (err) return res.cc(err)
        if (result.affectedRows !== 1) return res.cc('请求发送失败，请稍后再试')
        res.send(message)
    })
}

exports.selectInfo = (selectStr, message, res, fn) => {
    db.query(selectStr, (err, result) => {
        if (err) return res.cc(err)
        if (result.length === 0) return res.cc('获取用户信息失败')
        if(result[0].full_content) {
            result[0].full_content = result[0].full_content.toString()
        }
        message.data = result
        if (fn) {
            fn(message)
        }else {
            res.send(message)
        }

    })
}
