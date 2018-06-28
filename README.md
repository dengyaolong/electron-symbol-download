# electron-symbol-dl
downloads an electron release symbol zip 


## install

```
npm i electron-symbol-dl
```

## usage
```
const electronSymbolDl = require('electron-symbol-dl')
electronSymbolDl({versions: ['1.8.6'], pts: ['darwin-x64'], target: __dirname}) // download v1.8.6 mac symbol to current dir
electronSymbolDl.downloadAll({pts: ['darwin-x64'], target: __dirname}) // download all mac symbol to current dir
```

## API
### electronSymbolDl(options)

* options.versions, Array or version string. such as ['1.8.6', '2.0.3']
* options.pts, Array or platforms-arch string. could be set of ['darwin-x64', 'win32-ia32', 'win32-x64', 'linux-arm', 'linux-arm64', 'linux-armv7l', 'linux-ia32', 'linux-x64', 'mas-x64']
* options.target, symbol save dir

### electronSymbolDl.downloadAll(options)

* options.pts, Array or platforms-arch string. could be set of ['darwin-x64', 'win32-ia32', 'win32-x64', 'linux-arm', 'linux-arm64', 'linux-armv7l', 'linux-ia32', 'linux-x64', 'mas-x64']
* options.target, symbol save dir
