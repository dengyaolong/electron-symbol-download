const npmview = require('npmview')
const _download = require('download')
const fs = require('fs-extra')
const chunk = require('chunk')
const fstream = require('fstream')
const unzip = require('unzip')
const path = require('path')
const sha256File = require('sha256-file')


const MIRROR = 'https://npm.taobao.org/mirrors/electron/'
const PLATFORMS = ['darwin-x64', 'win32-ia32', 'win32-x64', 'linux-arm',
    'linux-arm64', 'linux-armv7l', 'linux-ia32', 'linux-x64', 'mas-x64']
function noop () {}

function flat(arr) {
    return arr.reduce((acc, val) => {
        return acc.concat(val)
    }, [])
}

function download(url, target) { 
    let writeStream = fs.createWriteStream(target)
    _download(url).pipe(writeStream);
    return streamToPromise(writeStream)
}

function streamToPromise(stream) {
    return new Promise((resolve, reject) => {
        stream.on('close', resolve)
            .on('error', reject)
    })
}

function getSymbols(version, pts) {
    let symbols = pts.map(pt =>`electron-v${version}-${pt}-symbols.zip`)
    return _download(`${MIRROR}${version}/SHASUMS256.txt`)
        .then(data => {
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
}

async function downloadElectronSymbol({symbol, sha256, version, target, debug=noop}) {
    let zipPath = path.resolve(target, symbol)
    let downloadPromise;
    // download
    if(fs.existsSync(zipPath)) {
        // downloadPromise = Promise.resolve()
        debug(symbol, 'zip is existed, do not download again')
    } else {
        let zipUrl =`${MIRROR}${version}/${symbol}`
        debug('now download symbol zip: ', zipUrl)
        await download(zipUrl, zipPath)
    }

    // check shasum
    let theSha256 = sha256File(zipPath)
    if(theSha256 !== sha256) {
        fs.removeSync(zipPath)
        debug('shasum check error')
        return Promise.reject('download Failed')
    }
    
    // unzip
    var readStream = fs.createReadStream(zipPath);
    let unzipDir = path.resolve(target, symbol.replace(/.zip$/, ''));
    if(fs.existsSync(unzipDir)) {
        debug(unzipDir, ' dir is existed, do not download again')
        return unzipDir
    }

    fs.ensureDirSync(unzipDir)
    debug('start unzip to', unzipDir)
    var writeStream = fstream.Writer(unzipDir);
    readStream
        .pipe(unzip.Parse())
        .pipe(writeStream)
    await streamToPromise(writeStream)
    debug('end unzip to', unzipDir)
    return unzipDir
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

function downloadElectronSymbols({versions, pts=PLATFORMS, target=__dirname, debug=noop}) {
    if(!versions) {
        debug('versions is required and must be an array of versions')
        return Promise.resolve([])
    }
    if(!Array.isArray(versions)) {
        versions = [versions]
    }
    if(versions.length === 0) return Promise.resolve([])
    return Promise.all(versions.map(version => {
       return getSymbols(version, pts)
            .then(symbols => {
                return Promise.all(symbols.map(symbol => {
                    symbol.target = target
                    symbol.debug = debug
                    debug('now download symbol is', JSON.stringify(symbol))
                    return downloadElectronSymbol(symbol)
                }))
            })
    }))
    .then(flat)
}

function getPts(pts) {
    if(!Array.isArray(pts)) return []
    return pts.filter(pt => PLATFORMS.indexOf(pt) !== -1)
}
async function downloadAll({pts=PLATFORMS, target, debug=noop, chunkSize=1}) {
    let allVersions = await getElectronVersions()
    let chunkedVersions = chunk(allVersions, chunkSize)
    let res = []
    for(let i = 0, l = chunkedVersions.length; i < l; i++) {
        let versions = chunkedVersions[i]
        debug('will download versions', JSON.stringify(versions))
        try {
            let r = await downloadElectronSymbols({versions, pts, target, debug})
            res = res.concat(r)
            debug('res', res)
        } catch(e) {
            debug('error', e)
        }
    }
    return res
}

module.exports = downloadElectronSymbols
module.exports.downloadAll = downloadAll
