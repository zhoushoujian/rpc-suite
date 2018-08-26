let crypt = require("./crypt");
require('./register');

function work(req,res){
    if (req.method != "POST") {
        res.writeHead(403, {});
        res.end("请使用post方式发送");
    }
    let chunks = [];
    let size = 0;
    req.on("data", function (buff) {
        size = buff.length;
        chunks.push(buff);
    })
    req.on("end", function (){
        logger.debug('收到客户端发来的数据:\n', String(crypt.decrypt(Buffer.concat(chunks, size), "it\'s raining outside and I do miss you")).replace(/^return\s+/, ""));
        new Promise(function (resolve, reject) {
            resolve(new Function(String(crypt.decrypt(Buffer.concat(chunks, size), "it\'s raining outside and I do miss you"))).apply(this))
        }).then(function (...args) {
            logger.debug('返回给客户端的结果', ...args);
            return res.end(crypt.encrypt(JSON.stringify(args), "one more kiss that is no crazy"));
        }).catch(function (e) {
            res.writeHead(500, {
                'Content-Type': 'text/plain'
            });
            return res.end(crypt.encrypt(String(e), "A error happened"));
        });
    })
}

module.exports = {
    check(req,res){
        work(req,res)
    },
    exec(req, res) {
        work(req,res)
    },
    other(req,res){
        work(req,res)
    }
}