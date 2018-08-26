require("./setenv");
let crypt = require("./crypt"),
    http = require("http"),
    path,
    port;

module.exports = remote = function (i, f, params, ...args) {
    if (!(params instanceof Array) || args.length) {
        arguments.length > 1 && args.unshift(params);
    } else {
        args = params;
    }
    params = JSON.stringify(args, function (p, o) {
        for (let k in o) {
            let v = o[k]
            o[k] = v instanceof Function ? v() : v;
        }
        return o;
    }, 4);
    //如果是发送远程机状态检查的请求,则check为true
    if (check) {
        path = '/remote/check';
        port = process.env.CHECK_SERVER_PORT; //2000端口用于检查远程机状态
    } else {
        path = '/remote/exec';
        port = process.env.SERVER_PORT; //rpc端口
    }
    let options = {
        path,
        port,
        hostname: available_ip[i],
        method: 'POST'
    }
    // logger.debug("path",path)
    // logger.debug("port",port)
    return new Promise(function (resolve, reject) {
        let req = http.request(options, function (res) {
            let chunks = [];
            res.on("data", function (data) {
                chunks.push(data);
            });
            res.on("end", function () {
                let data;
                if (res.statusCode !== 200) {
                    data = String(crypt.decrypt(Buffer.concat(chunks), "A error happened"));
                    logger.warn(func);
                    return reject("oh error " + res.statusCode + ":" + data);
                }
                data = String(crypt.decrypt(Buffer.concat(chunks), "one more kiss that is no crazy"));
                return resolve.apply(null, JSON.parse(data));
            });
        });
        req.on("error", reject);
        let func = "return " + f.toString() + `.apply(this,${params})`;
        req.write(crypt.encrypt(func, "it\'s raining outside and I do miss you"));
        req.end();
    });
};