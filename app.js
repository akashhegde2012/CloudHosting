const multer = require('multer');
const decompress = require('decompress');
const { fork, spawn, exec } = require('child_process');
const shell = require('shelljs');
const path = require('path');
const express =require('express'),
        app = express();
        bodyParser=require('body-parser'),
        fs = require('fs');
var upload=multer({dest:'uploads/'})
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',(req,res)=>{
    res.render('form');
});
app.post('/',upload.single('upload'),async (req,res)=>{
    console.log(req.file);
    var name=req.body.name;
    // await fs.copyFile('commands.sh','uploads/'+name+'/',(err)=>{if(err)console.log(err); else console.log("copied")});
    await decompress(req.file.path,'uploads/'+name);
    const content = 'npm install ./uploads/'+name+'/';

    await fs.writeFile('./uploads/'+name+'/commands.sh', content, err => {
    if (err) {
        console.error(err)
        return
    }
    // file written successfully
    })
    await fs.chmod('./uploads/'+name+'/commands.sh', 0o777, err => {
        if (err) throw err;
        console.log("File permission changed");
      });
    // var npm = await spawn('npm install --prefix ~/uploads/'+name+'/');
    const cmd =await spawn('./uploads/'+name+'/commands.sh')
    const child =await fork('./uploads/'+name+'/app.js')
    await fs.unlink(req.file.path,(err)=>{});
    res.send("done");
});
app.post('/git',async (req,res)=>{
    var url = req.body.git_url;
    var name=req.body.name;
    const path ='/home/akash/uploads/';
    await shell.cd(path)
    // var content = 'git clone '+url+' /home/akash/Documents/Remoteserver/uploads/'+name;
    await shell.exec('git clone '+url);
    a = url.split('/');
    b = a[a.length - 1].split('.')[0]
    var newpath=path+b;
    await shell.cd(newpath);
    await shell.exec('npm install');
    // await fs.writeFile('./cmd.sh', content, err => {
    //     if (err) {
    //         console.error(err)
    //         return
    //     }
    //     // file written successfully
    //     })
    // const cmd = await exec('sh cmd.sh');
    const child = fork(newpath+'/app.js');
    res.send('done')
})
app.listen(3000,(req,res)=>{
    console.log('running on 3000');
});