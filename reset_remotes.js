'use strict'
//单独运行重置所有远程机状态
require("./setenv");
require("./logger");
let http = require('http'),
    options;
//the switch of remote machine
global.one = true;
global.two = true;
global.three = true;
global.four = true;

var machine_array = [one, two, three, four]; //所有远程执行机的启用状态的数组
let temp_array = []; //启用了的远程机的数组下标
let available_ip = []; //启用了的远程机ip
machine_array.map((v, i) => {
    if (v) temp_array.push(i); //把所有的可用的远程执行机的数组下标存放到缓冲数组
});
let REMOTE_IP = process.env.REMOTE_IP.slice(1, -1).split(","); //所有远程机的ip
temp_array.map((v, i) => {
    available_ip.push(REMOTE_IP[v]); //把所有的可用的远程执行机的ip放到available_ip数组
})

console.warn("available_ip", available_ip);

Promise.all(available_ip.map((v, i) => {
    return new Promise(function (resolve, reject) {
        http.get(`http://${available_ip[i]}:${process.env.RESET_SERVER_PORT}`, function (res) {
            var result = '';
            res.on('data', function (d) {
                result += d.toString()
            });
            res.on('end', function () {
                resolve(result);
            });
        });
    })
})).then((result) => new Promise(function (res, rej) {
    logger.info("RESET result", result);
    res(result);
}))
.catch(error => {
    global.stop = true;
    logger.error("RESET error", error);
    process.exit(0)
});