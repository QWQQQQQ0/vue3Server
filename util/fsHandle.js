const fs = require('fs')
exports.handleRead = async (path) => {
    let result = await new Promise((resolve, reject) => {
        fs.readFile(path, (err,data) => {
            if (err) reject(err)
            resolve(data)
        })
    })
    return result
}
exports.handleWrite = async(path, file, res) => {
    let result = await new Promise((resolve, reject) => {
        fs.writeFile(path,file, (err,data) => {
            if (err) reject(err)
            res.send('文件上传成功')
        })
    })

}