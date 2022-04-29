const mysql = require("mysql")

const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '123456',
    database: 'uve_project'
})


module.exports = db