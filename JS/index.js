const commands = require('./commands');
const sources = require('./utils/sources');
const defaultSource = "vidstreaming";
const defaultDownloadFormat = "%episodenumber%-%name%.%ext%";

require('./utils/asyncForEach');

const displayHelp = () => {
    console.log(`Help:\n${commands.map(cmd => `${cmd.option} ${cmd.requiresArgs ? cmd.displayArgs + ' ' : ''}- ${cmd.description}`).join('\n')}`);
    process.exit();
}
if(process.argv.length <= 2) {
    console.log('Too few arguments.')
    displayHelp();
} else {
    let argsObj = {};
    process.argv.forEach((arg, i) => {
        let argument = arg.toLowerCase();
        let command = commands.find(command => command.option === argument);
        if(command) {
            if(command.requiresArgs) {
                if(process.argv[i+1] ? process.argv[i+1].startsWith('-') : true) {
                    argsObj[command.setVar] = null;  
                } else {
                    argsObj[command.setVar] = process.argv[i+1] || null;
                }
            } else {
                argsObj[command.setVar] = true;
            }
        }
    })

    const sites = sources.readSourcesFrom(__dirname + '/sites');
    const fs=require('fs') 
    if(argsObj.lsc) {
        console.log(`Sources:\n\n${sites.map(site => `${Object.keys(site.data).map(key => `${key === 'name' ? '- ' : '\t'+key.charAt(0).toUpperCase() + key.slice(1)+': '}${site.data[key]}`).join('\n')}`).join('\n\n')}`)
        return;
    } else if(!argsObj.searchTerm) {
        console.log('No search term found.');
        displayHelp();
    } else {
        (async () => {
            if(!argsObj.source) argsObj.source = defaultSource;
            let source = sites.find(site => site.data.name.toLowerCase() === argsObj.source.toLowerCase())
            if(!source) {
                console.log('Invalid source. Use -lsc to check the available sources.');
                displayHelp();
            }
            source = new source.source(argsObj, defaultDownloadFormat);
            
            source.on('chapterProgress', m => process.stdout.write(m))
            source.on('chapterDone', m => process.stdout.write(m))
            
            let episodes = await source.getEpisodes(argsObj.searchTerm);
            
            if(argsObj.fileName) {
                console.log('\nSaving into ' + argsObj.fileName);
                fs.writeFileSync(argsObj.fileName, episodes.join('\n'));
                console.log('Done!')
            }

            if((argsObj.download) || argsObj.download === null) {
                console.log('\n')
                let failedUrls = await source.download();
                if(failedUrls.length !== 0) {
                    console.log('\n\nSome downloads failed:\n');
                    console.log(failedUrls.join('\n'))
                }
            } else {
                console.log(`\n\nNext step is to copy these links into a text file and run youtube-dl!\nSample command: youtube-dl.exe -o "%(autonumber)${argsObj.searchTerm}.%(ext)s" -k --no-check-certificate -i -a dwnld.txt\n\n`);
                console.log(episodes.join('\n'))
                setInterval(() => {}, 100000);
            }
        })()   
    }
}
