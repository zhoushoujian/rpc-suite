let chokidar = require('chokidar'),
    path = require('path'),
    cluster = require("cluster"),
    os = require("os"),
    http = require("http"),
    exec = require('child_process').exec,
    arrayList = new Array, //存放执行exec的结果
    pid1 = new Number, //状态检查服务器的pid
    pid2 = new Number(), //任务执行服务器的pid
    main = () => {}, //启动子进程的函数
    dst_path = path.join(__dirname, "./"),
    server_file = path.join(__dirname, "./_server");

//获取本机ip
let address,
    networks = os.networkInterfaces();
Object.keys(networks).forEach(function (k) {
    for (var kk in networks[k]) {
        if (networks[k][kk].family === "IPv4" && networks[k][kk].address !== "127.0.0.1") {
            address = networks[k][kk].address;
            return address;
        }
    }
});

//加载依赖环境
{
    require('./setenv');
    require('./function');
}

let numCPUs = os.cpus().length;
if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    };
    cluster.on('listening', function (worker, address) {
        //console.log('listening: worker ' + worker.process.pid + ', port: ' + address.port);
    });
    cluster.on('online', function (worker) {
        //console.log('[master] ' + 'online: worker' + worker.id);
    });
    cluster.on('disconnect', function (worker) {
        console.log('[master] ' + 'disconnect: worker' + worker.id);
    });
    cluster.on('exit', function (worker, code, signal) {
        console.warn('worker ' + worker.process.pid + ' died');
    });
} else {
    //logger.info("cluster.worker.id", cluster.worker.id)
    if (cluster.worker.id === 1) {

        //监听文件变化 
        const watcher = chokidar.watch(dst_path, {
            ignored: /(^|[\/\\])\..|node_modules|server.log/,
            persistent: true
        });

        //主进程pid号
        logger.debug("main process pid", process.pid)
        //当所有文件全部被监视时触发
        watcher.on('ready', () => logger.debug('Initial scan complete. Ready for changes'))

        //启动服务
        main = function () {
            let child = exec(`node ${server_file}`);
            child.stdout.on('data', function (data) {
                arrayList.push(data);
                logger.debug(data);
            });
            child.stderr.on('data', function (data) {
                //logger.warn("stderr", data);
            });
            child.on('exit', function (code) {
                logger.warn('first 子进程已退出，代码：' + code);
            });
        };

        //首次调用时启动服务器    
        main();

        //捕获异常
        process.on('uncaughtException', function (err) {
            if (err == "Error: kill ESRCH") {
                logger.error("Error: kill ESRCH 子进程已退出");
            } else {
                logger.warn('Caught exception: ' + err);
            }
        });

        //监听事件的输出 
        setTimeout(function () {
            logger.debug("start to listen to output");
            watcher
                .on('error', error => logger.warn(`Watcher error: ${error}`.bold.red))
                .on('all', (event, path) => {
                    //状态检查服务器的pid
                    pid1 = arrayList.join(" ").split("process.pid  [ext]").slice(1, 2).toString().split("\u001b").slice(0, 1).join(" ").trim();
                    //任务执行服务器的pid
                    pid2 = arrayList.join(" ").split("process.pid  [ext]").slice(-1).toString().split("\u001b").slice(0, 1).join(" ").trim();
                    let kill = setInterval(() => {
                        if (main instanceof Function) {
                            logger.debug("kill child process");
                            //windows和linux通过pid结束进程的方式不同
                            if (process.platform === 'win32') {
                                process.kill(pid1, signal = 'SIGTERM');
                                process.kill(pid2, signal = 'SIGTERM');
                            } else if (process.platform === 'linux') {
                                exec(`kill -s 9 ${pid1}`);
                                exec(`kill -s 9 ${pid2}`);
                            }
                            main = null;
                        }
                        setTimeout(() => {
                            if (!main) {
                                main = function () {
                                    let child = exec(`node ${server_file}`);
                                    arrayList = [];
                                    child.stdout.on('data', function (data) {
                                        arrayList.push(data);
                                        logger.debug(data);
                                    });
                                    child.stderr.on('data', function (data) {
                                        //logger.warn("stderr", data);
                                    });
                                    child.on('exit', function (code) {
                                        logger.warn('again 子进程已退出，代码：' + code);
                                    });
                                };
                                main();
                                setTimeout(() => logger.info("新一轮的服务器监听已经启动"), 3000);
                            }
                        }, 2000); //处理完所有事件后再监听服务器  
                        clearInterval(kill);
                    }, 3000); //收集所有事件，完毕后一起处理   
                    logger.warn(event, path);
                });

            let server = http.createServer(function (req, res) {
                //服务器地址和端口对了就能进这个服务器
                let ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
                if (ip.split(',').length > 0) {
                    ip = ip.split(',')[0]
                }
                logger.info("收到客户端发来的重置请求", ip);
                pid1 = arrayList.join(" ").split("process.pid  [ext]").slice(1, 2).toString().split("\u001b").slice(0, 1).join(" ").trim();
                pid2 = arrayList.join(" ").split("process.pid  [ext]").slice(-1).toString().split("\u001b").slice(0, 1).join(" ").trim();
                try {
                    logger.debug("RESET kill child process");
                    if (process.platform === 'win32') {
                        process.kill(pid1, signal = 'SIGTERM');
                        process.kill(pid2, signal = 'SIGTERM');
                    } else if (process.platform === 'linux') {
                        exec(`kill -s 9 ${pid1}`);
                        exec(`kill -s 9 ${pid2}`);
                    }
                    setTimeout(() => {
                        main = function () {
                            let child = exec(`node ${server_file}`);
                            arrayList = [];
                            child.stdout.on('data', function (data) {
                                arrayList.push(data);
                                logger.debug("data", data);
                                res.end(`服务器${address}已重启`);
                            });
                            child.stderr.on('data', function (data) {
                                //logger.warn("stderr", data);
                            });
                            child.on('exit', function (code) {
                                logger.warn('again reset 子进程已退出，代码：' + code);
                            });
                        };
                        main();
                    }, 1500);
                } catch (error) {
                    logger.error("RESET error", error);
                    res.end(["An error happened", error]);
                }
            });
            server.listen({
                port: process.env.RESET_SERVER_PORT,
                exclusive: false
            });
            server.on("listening", function () {
                //logger.info('启动服务成功！');
                logger.info(`正在监听(http://${address}:${process.env.RESET_SERVER_PORT})`);
                process.title = `Test Server (http://${address}`;
            });

        }, 3000);
    } else if (cluster.worker.id === 2) {
        //判断平台，windows平台执行windows平台的显示cpu使用率和内存状况
        if (process.platform === "win32") {
            let ls = function () {
                let child = exec("win_info.bat");
                child.stdout.on('data', function (data) {
                    logger.write("stdout", data.replace(/[\r\n]/g, "  "));
                });
                child.stderr.on("data", function (data) {
                    logger.write("stderr", data);
                });
                child.on('exit', function (code) {
                    logger.write("win_info exit,code", code);
                });
            }
            setInterval(() => {
                ls();
            }, 20000)
            ls();
        } else if (process.platform === "linux") {
            //linux平台打印cpu使用率和内存使用信息
            let ls = function () {
                let child = exec(`iostat -c 1 ${numCPUs} && free -m `);
                child.stdout.on('data', function (data) {
                    logger.write(data);
                });
                child.stderr.on("data", function (data) {
                    logger.write("stderr", data);
                });
                child.on('exit', function (code) {
                    logger.write("linux_info exit,code", code);
                });
            }
            setInterval(() => {
                ls();
            }, 20000)
            ls();
        }
    }
}