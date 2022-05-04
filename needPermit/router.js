const express = require("express")

const router = express.Router()

const userHandler = require('./handle')

router.get('/getinfo', userHandler.getInfo)

router.post('/changepic', userHandler.handlePic)

router.post('/sendhtml', userHandler.receiveHtml)
router.post('/testby', userHandler.testBy)

router.post('/getfull', userHandler.sendFullContent)

router.get('/getselfartical', userHandler.sendUserArtical)

router.post('/modifyinfo', userHandler.modifyInfo)

router.post('/modifypwd_email', userHandler.sendIdentifyCode)
module.exports = router