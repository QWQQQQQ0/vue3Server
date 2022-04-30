
const express = require("express")

const router = express.Router()

const userHandler = require('./userRoute')

//注册
router.post('/reguser', userHandler.regUser)


//登录
router.post('/login', userHandler.login)

router.post('/mainPage', userHandler.loadFiles)

router.post('/sendcode', userHandler.receiveCode)

router.post('/test', userHandler.receiveImg)

// router.post('/testhtml', userHandler.receiveHtml)

module.exports = router