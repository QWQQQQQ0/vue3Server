const db = require('../db/userdata')

exports.changeInfo = (base,id,req,res) => {

    db.query(`update ${base} set ? where ${id}=?`, [req.body, req.user[id]], (err, result) => {
        if (err) return res.cc(err)
        // if (err) return console.log(err)
        if (result.affectedRows !== 1) return res.cc('更新用户信息失败')
        // if (result.affectedRows !== 1) return console.log('更新用户信息失败')
        res.send(req.message)

    })
}
exports.insertInfo = (base, info, message,res) => {
    db.query(`insert into ${base} set ?`, info, (err, result) => {
        if (err) return res.cc(err)
        if (result.affectedRows !== 1) return res.cc('注册用户失败，请稍后再试')
        res.send(message)
    })
}

exports.selectInfo = (base, id, message, res) => {
    db.query(`select * from ${base} where ${id.key}=${id.value}`, (err, result) => {
        if (err) return res.cc(err)
        if (result.length != 1) return res.cc('获取用户信息失败')
        if (res) return res.send(message)
    })
}
