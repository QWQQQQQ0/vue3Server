const express = require("express")

const router = express.Router()

const userHandler = require('./handle')

router.get('/getinfo', userHandler.getInfo)

router.post('/changepic', userHandler.handlePic)

router.post('/sendhtml', userHandler.receiveHtml)

module.exports = router