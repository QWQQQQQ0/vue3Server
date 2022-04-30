const express = require('express')
const cors = require('cors')
const expressJwt = require("express-jwt")


const app = express()
app.use(cors())
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use((req, res, next) => {
    res.cc = function (err, code = 1) {
        res.send({
            code,
            message: err instanceof Error ? err.message : err,
        })
    }
    next()
})
app.use(expressJwt({
    secret: 'vueServer', algorithms: ['HS256'],
}).unless({path: [/^\/api/]}))
app.use('/api', express.static('store'))
const outAccess = require('./user/user')
app.use('/api', outAccess)

const innerAccess = require('./needPermit/router')
app.use('/home', innerAccess)
app.use((err, req, res, next) =>{
    if (err.name === 'UnauthorizedError') {
        res.statuCode = 403
        return res.cc(res.statuCode)
    }
} )


app.listen(3688, () => {
    console.log('server is running at http://127.0.0.1:3688')
})