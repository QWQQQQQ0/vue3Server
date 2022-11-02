let ip = require('os')

module.exports = {
    emailSendConfig : {
        host:'smtp.qq.com',
        port: '465',
        secureConnection: true,
        auth: {user:'2778925023@qq.com', pass: 'srwunhezuphmddfc'}
    },
    data : {
        subject: '验证码',
        from: '2778925023@qq.com',
        to: '',
        text: ``
    },
    // ipAddress:ip.networkInterfaces()['WLAN'][1].address
}