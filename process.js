var shell = require("shelljs");
const { performance } = require('perf_hooks');
const links = ['https://github.com/akashhegde2012/test.git', 'https://github.com/akashhegde2012/YelpCamp.git', 'https://github.com/akashhegde2012/Bus_Reservation_System.git'];
for(var i = 0;i<links.length;i++){
    const start = new Date();
    console.log(start.getMinutes()*60 + start.getSeconds());
    shell.exec("node ./function "+links[i])
    const end = new Date()
    console.log(end.getMinutes()*60 + end.getSeconds())
}