const dl = require('./index.js')
const path = require('path')
dl({versions:['1.8.3'], pts:['darwin-x64', 'win32-ia32'], debug: console.log, target: __dirname}).then(console.log)
// dl.downloadAll({pts:['darwin-x64', 'win32-ia32'], debug: console.log}).then(console.log)
