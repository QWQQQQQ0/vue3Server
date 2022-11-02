const express = require('express')
const fs = require('fs')
const db = require('../db/userdata')

const app = express()

// db.query('select artId, uid, full_content from articals where artId<63', (err, result) => {
//     result.forEach(element => {
//         fs.writeFile(`../store/article/${element.artId}.txt`,element.full_content, (err) => {
//             if (err) console.log(err)
            
//         })
//         db.query(`update articals set ? where artId=?`, [{content_address: `/article/${element.artId}.txt`}, element.artId], (err, result) => {

//             console.log('修改成功',err)
//         })
//     });
// })
db.query('select * from articals where cut_content regexp "犯罪概念"', (err, result) => {
    console.log(result)
})

// app.listen(4688, () => {
//     console.log('server is running at http://127.0.0.1:4688')
// })