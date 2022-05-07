require('dotenv').config();
const multer = require('multer');
const decompress = require('decompress');
const { fork, spawn } = require('child_process');
const shell = require('shelljs');
const path = require('path');
const PORT = process.env.PORT;
const USER = process.env.USER;
const express =require('express'),
        app = express();
        bodyParser=require('body-parser'),
        fs = require('fs'),
        mongoose=require('mongoose'),
        passport=require('passport/lib'),
        localStrategy=require('passport-local/lib'),
        methodOverride = require('method-override'),
        flash = require('connect-flash'),
        User=require('./models/user'),
        Container = require('./models/container'),
        middlewareObj = require('./middleware/index');

var upload=multer({dest:'uploads/'});
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(flash());
mongoose.connect("mongodb://localhost/cloud_hosting");
app.use(express.static(__dirname+'/public'));
app.use(methodOverride("_method"));
// passport configuration
app.use(require('express-session')(
    {
        secret:"hosting platform",
        resave:false,
        saveUninitialized:false
    }
));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

app.get('/',(req,res)=>{
    res.render('index');
})
//============
//Aut routes
//++++++++++++
app.get('/register',function(req,res){
    res.render('register');
});
// handell sign up 
app.post('/register',function(req,res){
    var newUser= new User({username:req.body.username});
    User.register(newUser,req.body.password, function(err,user){
        if(err)
        {
            req.flash('error', err.message);
            return res.render('register');
        }
        passport.authenticate('local')(req, res, function(){
            req.flash('success','Welcome to YelpCamp '+user.username);
            res.redirect('/containers');
        });
    });
});
//show login form
app.get('/login',function(req,res){
    res.render('login');
});
//app.post('/login',middleware,callback function);
app.post('/login', passport.authenticate('local',
{
    successRedirect:'/containers',
    failureRedirect:'/'
}
),function(req,res){

});
//logout
app.get('/logout',function(req,res){
    req.logout();
    req.flash('success',"logged you out");
    res.redirect('/');
});
// middlwware
app.get('/containers', middlewareObj.isLoggedIn,async (req,res)=>{
    console.log(req.user);
    Container.find({'owner.id':req.user._id}, (err,containers)=>{
        console.log(containers);
        res.render('containers',{containers:containers});
    });
});
app.get('/containers/new', middlewareObj.isLoggedIn,(req,res)=>{
    console.log(req.user);
    res.render('form');
});
app.post('/containers/new', middlewareObj.isLoggedIn,async (req,res)=>{
    var url = req.body.git_url;
    var name=req.body.name;
    var image_name = req.user.username+'/'+name;
    var port = Math.floor(3001 + Math.random() * 9000);
    var env = req.body.env.split('\r\n');
    console.log(env);
    var build_args = ''
    env.forEach(arg=>{
        build_args = build_args + ' --build-arg '+arg;
    });
    console.log('docker build'+build_args+' -t '+image_name+' .')
    const path =`/home/${USER}/uploads/`;
    await shell.cd(path)
    // var content = 'git clone '+url+' /home/akash/Documents/Remoteserver/uploads/'+name;
    await shell.exec('git clone '+url);
    
    a = url.split('/');
    b = a[a.length - 1].split('.')[0]
    var newpath=path+b;
    await shell.cp('-r',`/home/${USER}/Documents/RemoteServer/Dockerfile`,newpath);
    await shell.cd(newpath);
    
    var image_id = await shell.exec('docker build --build-arg '+env+' -t '+image_name+' .');
    var resp = await shell.exec('docker run --name '+name+' -p '+port+':8080 -d '+image_name);
    console.log('container = ' +resp);
    var newContainer = {
        github_link:url,
        container_name:name,
        container_id:''+resp,
        image_name:image_name,
        port: port,
        // image_id:image_id.stdout,
        owner:{
            id:req.user._id,
            username:req.user.username
        }
    }
    User.findById(req.user._id,(err,user)=>{
        if(err){
            console.log(err);
        }
        else{
            Container.create(newContainer, (err,container)=>{
                console.log(container);
                user.containers.push(container._id);
                user.save();
                console.log(user);
                res.redirect('/containers');
            });
        }
    })
    // await console.log(newContainer);
    
});
app.get('/containers/:id', middlewareObj.isLoggedIn, async (req,res)=>{
    Container.findById(req.params.id, (err,container)=>{
        res.render('container',{container:container});
    });
});
app.put('/containers/:id', middlewareObj.isLoggedIn, async (req,res)=>{
    // console.log(req.param.id);
    Container.findById(req.params.id, async (err,container)=>{
        console.log(container);
        var url = container.github_link;
        const path =`/home/${USER}/uploads/`;
        await shell.exec('docker stop '+container.container_name);
        await shell.exec('docker rm '+container.container_name);
        await shell.exec('docker rmi '+container.image_name);
        a = url.split('/');
        b = a[a.length - 1].split('.')[0]
        var newpath=path+b;
        await shell.cd(newpath);
        await shell.exec('git pull '+url);
        var image_id = await shell.exec('docker build -t '+container.image_name+' .');
        var resp = await shell.exec('docker run --name '+container.container_name+' -p '+container.port+':8080 -d '+container.image_name);
        console.log('container = ' +resp);
        container.container_id = resp.stdout;
        container.save();
        res.redirect('/containers/'+container._id);

    })
    
});
app.delete('/containers/:id',middlewareObj.isLoggedIn, async (req,res)=>{
    // console.log(req.param.id);
    Container.findByIdAndDelete(req.params.id, async (err,container)=>{
        console.log(container);
        var url = container.github_link;
        const path ='/home/akash/uploads/';
        await shell.exec('docker stop '+container.container_name);
        await shell.exec('docker rm '+container.container_name);
        await shell.exec('docker rmi '+container.image_name);
        a = url.split('/');
        b = a[a.length - 1].split('.')[0]
        var newpath=path+b;
        await shell.exec('rm -rf '+newpath);
        
        User.findById(req.user._id,(err,user)=>{
            var index = user.containers.indexOf(container._id);
            user.containers.splice(index,1);
            user.save()
            console.log(user);
            res.redirect('/containers');
        })
    });
    
    
});
app.listen(PORT,(req,res)=>{
    console.log('running on '+PORT);
});