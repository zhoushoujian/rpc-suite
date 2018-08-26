const cluster = require('cluster');
const http = require('http');
const cpuNums = require('os').cpus().length;
/*process.env.NODE_DEBUG='net';*/
if(cluster.isMaster){
    for(let i=0;i<cpuNums;i++){
        cluster.fork();
    }
    cluster.on('exit',(worker)=>{
        console.log(`worker${worker.id} exit.`)
    });
    cluster.on('fork',(worker)=>{
        console.log(`fork：worker${worker.id}`)
    });

    cluster.on('disconnect',(worker)=>{
        console.log(`worker${worker.id} is disconnected.`)
    });
    cluster.on('listening',(worker,addr)=>{
        console.log(`worker${worker.id} listening on ${addr.address}:${addr.port}`)
    });
    cluster.on('online',(worker)=>{
        console.log(`worker${worker.id} is online now`)
    });

    cluster.on('message',(worker,msg)=>{
        console.log(`got the worker${worker.id}'s msg：${msg}`);
    });

    Object.keys(cluster.workers).forEach((id)=>{
        cluster.workers[id].send(`hello worker${id}`);
    });
}else{
    process.on('message',(msg)=>{
        console.log('worker'+cluster.worker.id+' got the master msg：'+msg);
    });
    process.send('hello master, I am worker'+cluster.worker.id);
    http.createServer((req,res)=>{
        res.writeHead(200);
        res.end('hello world'+cluster.worker.id);
    }).listen(3000,'127.0.0.1');
}