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
