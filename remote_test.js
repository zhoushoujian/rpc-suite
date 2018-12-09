let remote = require('./remote');
require('./register');

let local = () => {},
    remote01 = () => {},
    remote02 = () => {},
    remote03 = () => {},
    remote04 = () => {},
    //远程执行机的启用开关
    one = true,
    two = false,
    three = false,
    four = false,
    REMOTE_IP = [],
    http = require('http'),
    cluster = require("cluster");

global.available_ip = []; //remote.js需要使用
global.check = true; //remote.js要用

var machine_array = [one, two, three, four]; //所有远程执行机的启用状态的数组
let temp_array = []; //启用了的远程机的数组下标
machine_array.map((v, i) => {
    if (v) temp_array.push(i); //把所有的可用的远程执行机的数组下标存放到缓冲数组
});
REMOTE_IP = process.env.REMOTE_IP.slice(1, -1).split(","); //所有远程机的ip

temp_array.map((v, i) => {
    available_ip.push(REMOTE_IP[v]); //把所有的可用的远程执行机的ip放到available_ip数组
})

function Product(i, ...arg) {
    return function () {
        return remote(i, function (...arg) {
            //只允许传递的参数是数字类型
            let other = arg.filter((v) => Object.prototype.toString.call(v) !== '[object Number]')
            if (other.length) return Promise.resolve("illegal type")
            return product(arg[0], arg[1])
        }, [...arg]).then(s => new Promise(function (resolve, reject) {
                logger.info(`remote${i+1} result`, s);
                resolve(s);
            })
            .catch(error => {
                logger.error("Product error", error);
            }))
    }
}

//每个子进程都会运行一遍上面的程序
//开启多进程 => 第一个进程用于执行任务,第二个进程用于执行任务期间查询并接收服务传来的状态
let numCPUs = require("os").cpus().length;
if (cluster.isMaster) {
    //主进程的程序只会运行一遍
    //先检查所有远程机状态(20秒后才能返回检查结果)
    return new Promise(function (resolve, reject) {
        logger.info("启用的远程机ip", available_ip);
        logger.debug("正在检查远程机状态");
        return Promise.all(available_ip.map((v, i) => {
                return remote(i, function () {
                    return checkstate();
                })
            })).then((result) => new Promise(function (res, rej) {
                logger.debug("check result => ok", result);
                res(result);
                resolve(result);
            }))
            .catch(error => {
                logger.error("check error", error);
                logger.error("check  远程机检查不通过，请确认远程机服务已启动！")
                process.exit(0)
            });
    }).then(() => Promise.all(available_ip.map((v, i) => { //再重置远程机状态
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
        logger.info("RESET result => ok", result);
        res(result);
    }))).then(() => Promise.all(available_ip.map((v, i) => { //重置状态后再次检查状态以确保重置成功
        return remote(i, function () {
            return checkstate();
        })
    })).then((result) => new Promise(function (res, rej) {
        logger.debug("check again result  => ok", result);
        res(result);
        resolve(result);
    }))).then(() => {
        //预备工作执行完再fork多进程
        for (var i = 0; i < numCPUs; i++) {
            //fork出工作线程后子进程会直接进入子进程模块执行
            cluster.fork();
        }
        cluster.on('listening', function (worker, address) {
            //console.log('listening: worker ' + worker.process.pid + ', port: ' + address.port);
        });
        cluster.on('online', function (worker) {
            //console.log('[master] ' + 'online: worker' + worker.id);
        });
        cluster.on('disconnect', function (worker) {
            logger.warn('[master] ' + 'disconnect: worker' + worker.id);
        });
        cluster.on('exit', function (worker, code, signal) {
            logger.warn('worker ' + worker.process.pid + ' died');
        });
        //对执行任务的时间进行统计
        console.time("time");
        return new Promise(function (res, rej) {
            global.check = null;
            let tmp_array = [];
            available_ip.forEach((v) => {
                tmp_array.push(REMOTE_IP.indexOf(v))
            })
            //判断需要执行任务的远程机并赋值对应的执行函数
            tmp_array.map((v, i) => {
                switch (v) {
                    case 0:
                        remote01 = new Product(i, 8, 7);
                        break;
                    case 1:
                        remote02 = new Product(i, 8, 7);
                        break;
                    case 2:
                        remote03 = new Product(i, 8, 7);
                        break;
                    case 3:
                        remote04 = new Product(i, 8, 7);
                        break;
                    default:
                        break;
                }
            })
            logger.info("正在执行任务，请稍后")
            return Promise.all([remote01(), remote02(), remote03(), remote04()]) //最后执行任务
                .then((s) => {
                    return new Promise(function (res) {
                        //全部执行完再输出结果
                        logger.info("final result", s);
                        console.timeEnd("time");
                        //将结果发送到子进程,父子进程和子进程传递消息与react类似
                        Object.keys(cluster.workers).forEach((id) => {
                            cluster.workers[id].send(s);
                        });
                        //cluster.disconnect();
                        process.exit(0);
                        res(s);
                    })
                })
                .catch((error) => {
                    logger.error("remote_test error", error);
                    process.abort();
                })
        })
    })
} else {
    if (cluster.worker.id === 1) {
        //master运行得到的结果保存到顶部变量,子进程是获取不到的
        let finalResult = [];
        process.on('message', (msg) => {
            logger.info('worker' + cluster.worker.id + ' got the master msg：' + msg);
            finalResult = msg;
        });

        function remote_info() {
            if (finalResult.length) {
                //任务执行完成后停止查询
                clearInterval(timer);
                process.nextTick(process.exit(0));
            }
            return Promise.all(available_ip.map((v, i) => {
                    return remote(i, function () {
                        return checkstate();
                    })
                }))
                .then((result) => new Promise(function (res, rej) {
                    logger.debug("remote info", result);
                    res(result);
                }))
                .catch(error => {
                    logger.error("remote info error", error);
                    process.exit(0)
                });
        }
        let timer = setInterval(remote_info, 20000);
        process.on('exit', (code) => {
            logger.warn(code);
        });
        process.on('uncaughtException', (err) => {
            logger.error(err);
        });
        //结束主控机程序时同时重置远程机状态(有点问题)
        process.on('SIGINT', function () {
            logger.info('任务被用户取消，请手动运行reset_remote.js以停止远程机的任务执行');
            //logger.debug("available_ip",available_ip);
            Promise.all(available_ip.map((v, i) => {
                http.get(`http://${available_ip[i]}:${process.env.RESET_SERVER_PORT}`, function (res) {
                    res.on('end', function () {
                        logger.info('远程机已停止操作，程序即将退出');
                    });
                })
            })).then(() => new Promise(function (res) {
                res(process.exit(0))
            }))
        });
    } else {
        process.on('message', (msg) => {
            logger.debug('worker' + cluster.worker.id + ' got the master msg：' + msg);
            setTimeout(() => {
                process.exit(0);
            })
        });
        process.on('exit', (code) => {
            logger.warn(code);
        });
        process.on('uncaughtException', (err) => {
            logger.error(err);
        });
    }
}



//promise.race
//需手动指定需要运行的远程机函数
// return Promise.race([remote01(), remote02(), remote03(), remote04()])
//     .then((s) => {
//         logger.info("s", s)
//     })
// .catch((error) => {
//     logger.error("error", error);
// })