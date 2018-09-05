let crypt = require('./crypt'),
    assert = require('assert');
describe("crypt test",function(){
    this.timeout(5000);
    it('standard test',function(){
        let src = crypt.encrypt("standard","依然不变的仰望，满天迷人的星光");
        let dst = crypt.decrypt(src,"依然不变的仰望，满天迷人的星光");
        assert.ok( String(dst) === "standard" );
    })
    it("test time",function(done){
        this.timeout(250);
        crypt.timevalid = 120;
        let src = crypt.encrypt("time","天在下雨我在想你");
        setTimeout(function(){
            let dst = crypt.decrypt(src,"天在下雨我在想你");
            assert.notEqual( String(dst) ,"time" );
            done()
        },150)
    })
    it("test key",function(){
        let src = crypt.encrypt("key","你说孤独是诗人应该具有的体会，写歌的人就该有伤悲");
        let dst = crypt.decrypt(src,"你说孤独是诗人应该具有的体会");
        assert.notDeepEqual( String(dst) ,"key" );
    })
})