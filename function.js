require('dotenv').config();
const process = require('process');
const shell = require('shelljs');
var args = process.argv;
const USER = process.env.USER;

async function run(){

    // console.log(args[2]);
    // console.log(process.pid);

    // await setTimeout(()=>{
    //     console.log(process.pid+" end");
    // },5000)
    
    const url = args[2];
    const path =`/home/${USER}/uploads/`;
    await shell.cd(path)
    // var content = 'git clone '+url+' /home/akash/Documents/Remoteserver/uploads/'+name;
    await shell.exec('git clone '+url);
    
    a = url.split('/');
    b = a[a.length - 1].split('.')[0]
    var newpath=path+b;
    await shell.cp('-r',`/home/${USER}/Documents/RemoteServer/Dockerfile`,newpath);
    await shell.cd(newpath);
    var link = await shell.exec('heroku create');
    console.log(link)
    await shell.exec('heroku container:push web');
    await shell.exec('heroku container:release web');
    console.log("done");
}
run();
module.exports = run;