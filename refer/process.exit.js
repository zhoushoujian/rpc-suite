let http = require('http')

http.createServer((req, res) => {

}).listen(2500);
console.log('createServer now!');
process.on('SIGINT', function () {
    setTimeout(function(){
        process.exit(0);
    })
    console.log('Exit now!');
});
