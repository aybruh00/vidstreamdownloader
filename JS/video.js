const fetch = require('node-fetch');
const m3uLib = require('./m3u');
const fs = require('fs')

module.exports.download = (url, format, name, episodenumber, m3ures) => {
    // Can download normally...
    return new Promise((resolve, rej) => {
        if(url.endsWith('.mp4')) {
            let ext = url.split('.')[url.split('.').length-1]
            fetch(url).then(res => {
                const dest = fs.createWriteStream(`./${format.replace('%episodenumber%', episodenumber).replace('%name%', name).replace('%ext%', ext)}`);
                res.body.pipe(dest);
                res.body.on('end', () => {
                    resolve();
                })
                res.body.on('error', err => {
                    rej({m: err, url})
                })
            })
        } else if(url.endsWith('.m3u') || url.endsWith('.m3u8')) {
            fetch(url).then(res => res.text()).then(m3u => {
                let endpoint = url.split('/')
                endpoint.pop();
                endpoint = endpoint.join('/');
                
                let parsedFile = m3uLib.parse(m3u);
                let res = m3ures;
                if(m3ures === 'highest') {
                    // this is fucking stupid
                    parsedFile.map(lines => {
                        if(res === 'highest') {
                            if(lines.type === 'header') {
                                if(lines.info) {
                                    if(lines.info.RESOLUTION || lines.info.NAME) {
                                        res = lines;
                                    }
                                }
                            }
                        }
                    })
                }
                if(!res.info) {
                    res = parsedFile.filter(o => {
                        if((o.type === 'header') && ((o.info.RESOLUTION === res) || (o.info.NAME === res))) { 
                            return true
                        } else {
                            return false
                        }
                    })[0];
                }
                //console.log(parsedFile)
                //console.log(res)
                
            })
        } else {
            rej({m: 'For now, vidstreamdownloader (JS) only supports downloading .mp4 files!', url})
        }
    })
    
}