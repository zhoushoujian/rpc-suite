'use strict';
global.logger = require('./logger');
let total,
    products,
    os=require("os"),
    exec=require("child_process").exec;

exports.product = function func02(a, b) {
    return new Promise(function (res, rej) {
        for(let i=1;i<1e10;i++){
            products = (a + b) * i;
        }
        logger.debug('products', products);
        res(products)
    })
}

exports.checkstate = function func03(){
    let arrayList = [],
        address,
        networks = os.networkInterfaces();
    Object.keys(networks).forEach(function (k) {
        for (var kk in networks[k]) {
            if (networks[k][kk].family === "IPv4" && networks[k][kk].address !== "127.0.0.1") {
                address = networks[k][kk].address;
                return address;
            }
        }
    });
    return new Promise(function(res,rej){
        if(process.platform === "win32"){
            let child = exec("win_info.bat");
            child.stdout.on('data',function(data){
                logger.debug("stdout",data.replace(/[\r\n]/g,"  "));
                arrayList.push(data);
            });
            child.stderr.on("data",function(data){
                if(data) res(data);
                logger.warn("stderr",data);
            });
            child.on('exit',function(code){
                logger.warn("win_info exit,code",code);
            });
            setTimeout(function(){
                logger.info("IP",address,"info",arrayList.join("").replace(/[\r\n]/g," ").split(","))
                res(["IP",address,"info",arrayList.join("").replace(/[\r\n]/g," => ").split(",")])
            },10000);
        } else if (process.platform === "linux"){
            let child = exec(`bash linux_cpu.sh`);
            child.stdout.on('data',function(data){
                logger.debug("stdout",data.replace(/[\r\r\n]/g," => ").split(","));
                arrayList.push(data);
            });
            child.stderr.on("data",function(data){
                logger.warn("stderr",data);
                if(data) res(data);
            });
            child.on('exit',function(code){
                logger.warn("linux_info exit,code",code);
            });
            setTimeout(function(){
                logger.info("IP",address,"info",arrayList.join("").replace(/[\r\r\n]/g," ").split(","));
                res(["IP",address,"info",arrayList.join("").replace(/[\r\r\n]/g," => ").split(",")]);
            },10000);
        }
    })
}