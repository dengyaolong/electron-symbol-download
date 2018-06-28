const dl = require('./index.js')
const path = require('path')
dl({versions:['1.8.6'], pts:['darwin-x64'], target: path.resolve(__dirname, '../')}).then(console.log)
