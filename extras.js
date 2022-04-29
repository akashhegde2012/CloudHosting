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