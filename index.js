
const npmview = require('npmview');
const download = require('download')
const fs = require('fs')
const path = require('path')
const sha256File = require('sha256-file');


const MIRROR = 'https://npm.taobao.org/mirrors/electron/'
const PLATFORMS = ['darwin-x64', 'win32-ia32', 'win32-x64', 'linux-arm', 'linux-arm64', 'linux-armv7l', 'linux-ia32', 'linux-x64', 'mas-x64']

function getSymbols(version, pts) {
    console.log(`${MIRROR}v${version}/SHASUMS256.txt`)
    let symbols = pts.map(pt =>`electron-v${version}-${pt}-symbols.zip`)
    return download(`${MIRROR}${version}/SHASUMS256.txt`)
        .then(data => {
            console.log(data)
            let lines = data.toString().split('\n')
            let shaAndSymbol = lines
                .filter(line => {
                    return symbols.some(symbol => line.indexOf(symbol) != -1)
                })
                .map(line => {
                    let [sha256, symbol] = line.split(' *')
                    return {sha256, symbol, version}
                })
            return shaAndSymbol
        })
        .catch(console.log)
}

function downloadSymbol({symbol, sha256, version, target}) {
    console.log(target, symbol)
    target = path.resolve(target, symbol)
    console.log(target)
    console.log(`${MIRROR}${version}/${symbol}`)
    return download(`${MIRROR}${version}/${symbol}`)
        .then(data => {
            fs.writeFileSync(target, data);
        })
        .then(() => {
            let theSha256 = sha256File(target)
            if(theSha256 === sha256) {
                // 解压到指定的文件目录
                return target
            } else {
                fs.removeFileSync(target)
                return Promise.reject('download Failed')
            }
        })
}

function getElectronVersions() {
    return new Promise((resolve, reject) => {
        npmview('electron', function(err, version, moduleInfo) {
            if (err) {
                return reject(err)
            }

            let versions = moduleInfo.versions;
            return resolve(versions)
        });
    })
}

function downloadElectron({versions, pts=PLATFORMS, target=__dirname}) {
    console.log(versions)
    if(!versions) return Promise.resolve([])
    if(!Array.isArray(versions)) {
        versions = [versions]
    }
    if(versions.length === 0) return Promise.resolve([])
    return Promise.all(versions.map(version => {
        console.log(version)
       return getSymbols(version, pts)
            .then(symbols => {
                console.log(symbols)
                return Promise.all(symbols.map(symbol => {
                    symbol.target = target
                    return downloadSymbol(symbol)
                }))
            })
    }))
}

function getPts(pts) {
    if(!Array.isArray(pts)) return []
    return pts.filter(pt => PLATFORMS.indexOf(pt) !== -1)
}
function downloadAll({pts=PLATFORMS, target}) {
    return getElectronVersions()
        .then(versions => {
            return downloadElectron({versions: versions, pts: pts, target: target})
        })
}

module.exports = downloadElectron
module.exports.downloadAll = downloadAll
