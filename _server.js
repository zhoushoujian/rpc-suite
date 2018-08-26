let http = require("http"),
    fs = require("fs"),
    cluster = require("cluster"),
    os = require("os"),
    server;

global.logger = require('./logger');

function _server() {
    //获取ip地址
    handle = module.exports = {
        "/local/ip": function () {
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
            return address;
        }
    };

    //加载远程过程调用
    {
        let remote = require("./_remote");
        for (let k in remote) {
            handle["/remote/" + k] = remote[k];
        }
    }

    server = http.createServer((req, res) => {
        var url = req.url;
        if (handle[url]) {
            if (url.slice(1, 7).toLowerCase() === "remote") {
                return handle[url](req, res);
            }
        }
        res.setHeader('Content-Type', 'text/javascript;charset=UTF-8');
        res.end(function () {
            return fs.readFileSync(url);
        });
    });

    process.on('SIGTERM', function () {
        //仅对linux生效
        logger.info("本程序运行了(秒)", process.uptime());
        process.exit(0);
    });

    logger.info("process.pid", process.pid);
}

let numCPUs = os.cpus().length;
if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
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
    // logger.info("cluster.worker.id", cluster.worker.id)
    //执行任务的进程
    if (cluster.worker.id === 1) {
        _server();
        server.listen({
            port: process.env.SERVER_PORT,
            exclusive: true    //独占一个进程
        });
        server.on("listening", function () {
            //logger.info('启动服务成功！');
            logger.info(`正在监听(http://${handle["/local/ip"]()}:${process.env.SERVER_PORT})`);
        });
    } else if (cluster.worker.id === 2) {
        //检查服务器状态的进程
        _server();
        server.listen({
            port: process.env.CHECK_SERVER_PORT,
            exclusive: true
        });
        server.on("listening", function () {
            //logger.info('启动服务成功！');
            logger.info(`正在监听(http://${handle["/local/ip"]()}:${process.env.CHECK_SERVER_PORT})`);
        });
    }
}