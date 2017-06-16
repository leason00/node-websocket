/**
 * 入口文件
 * Created by leason on 2017/6/2.
 */
var app = require('express')();
var os = require('os');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redisClient = require('./redisClient');
var config = require('./config');
var log4js = require("./log");
var crypto = require('crypto');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
function md5(str) {
    var ret = crypto.createHash('md5').update(str.toString()).digest("hex");
    return ret;
}
//服务器信息
function managerInfo() {
    var data = {
        cpus:os.cpus(),         //cpu
        totalmem:os.totalmem(),
        freemem:os.freemem(),   //空闲内存字节
        loadavg:os.loadavg(),   //系统最近5、10、15分钟的平均负载
        platform:os.platform(), //操作系统类型
        type:os.type(),         //操作系统名称
        release:os.release(),   //操作系统版本
        uptime:os.uptime()      //正常运行时间
    };
    return data;
}
exports.worker = function(workerID,log) {
    /**
     * 域名空间leason
     * 利用redis订阅功能
     * 实现信息更新提醒
     */
    var nsp = io.of('/leason');
    nsp.on('connection', function(socketS){
        log.info('someone connected' + socketS.id);
        log.info(socketS.id);
        socketS.emit('connected', {status:'success'});
        socketS.on('login', function(data){
            var appkey = data.appkey;
            //验证appkey的正确性
            process.send('add');
            var loginName = md5(data.appkey + data.ssid);
            redisClient.redisClientPub.subscribe(loginName);       //订阅指定频道
            log.info('login' + data.name);
            nsp.emit(data.name, data.name);
            redisClient.redisClientPub.on('message', function(channel, message) {
                if(loginName == channel){
                    nsp.emit(data.name, message);
                }
            });
            socketS.on('disconnect', function(){
                log.info(data.name+'disconnect');
                redisClient.redisClientPub.unsubscribe(loginName);  //断开退订订阅制定频道
                process.send('reduce');
            });
        });
    });

    /**
     * 域名空间leasonList
     * 利用redis列表
     * 实现信息推送
     */
    var nspList = io.of('/leasonList');
    nspList.on('connection', function(socketList){
        log.info('leasonList someone connected');
        socketList.emit('connected', {status:'success'});
        socketList.on('login', function(data){
            log.info('login' + data.name);
            var appkey = data.appkey;
            //验证appkey的正确性
            process.send('add');
            var loginName = md5(data.appkey + data.ssid);
            var getinfo = setInterval(function() {
                redisClient.redisClientList.rpop(loginName, function(error, res){
                    if(res !== null){
                        log.info(res + data.name);
                        socketList.emit(data.name, res);
                    }
                });
            },config.getInforTime);
            socketList.on('disconnect', function(){
                log.info(data.name+'leasonList disconnect');
                clearInterval(getinfo);
                process.send('reduce');
            });
        });
    });

    /**
     * 域名空间leasonChat
     * 实现聊天
     */
    // var Chat = io.of('/leasonChat');
    // Chat.on('connection', function(socketChat){
    //     log.info('leasonChat someone connected');
    //     socketChat.emit('connected', {status:'success'});
    //     socketChat.on('login', function(data){
    //         ++numUsers;
    //         log.info('login' + data.name);
    //         // socketChat.join('chrome');
    //         socketChat.emit('num', {
    //             numUsers: numUsers
    //         });
    //         socketChat.broadcast.emit('num', {
    //             numUsers: numUsers
    //         });
    //         socketChat.on('msg', function(msg){
    //             log.info(data.name+msg);
    //             socketChat.emit('msg', {username:data.name,msg:msg.msg});
    //             socketChat.broadcast.emit('msg', {username:data.name,msg:msg.msg});
    //         });
    //         socketChat.on('disconnect', function(){
    //             log.info(data.name+'退出聊天');
    //             socketChat.broadcast.emit('msg', {username:'通知',msg:data.name+'退出聊天'});
    //             --numUsers;
    //             socketChat.emit('num', {
    //                 numUsers: numUsers
    //             });
    //             socketChat.broadcast.emit('num', {
    //                 numUsers: numUsers
    //             });
    //         });
    //     });
    // });
    /**
     * 服务管理
     * 服务监控
     */
    var manager = io.of('/manager');
    manager.on('connection', function(socketManager){
        log.info('manager someone connected');
        socketManager.emit('connected', {status:'success'});
        socketManager.on('login', function(data){
            if(data.appkey == 'leason'){
                var sendInfo = setInterval(function() {
                    redisClient.redisClientInfo.get("userNum", function(err, reply) {
                        console.log(reply.toString());
                        var info = managerInfo();
                        socketManager.emit('info', {
                            data: info,
                            num:reply
                        });
                    });
                },config.getInforTime);
            }
            socketManager.on('disconnect', function(){
                log.info(data.name+'退出');
                clearInterval(sendInfo);
            });
        });
    });
//web服务
    app.get('/', function(req, res){
        console.log("主页 GET 请求");
        res.send('Hello GET');
    });
    app.post('/leason', function (req, res) {
        log.info(req.body);
        // 输出 JSON 格式
        var response = {
            "first_name":req.body.first_name,
            "last_name":req.body.last_name
        };
        log.info(response);
        res.end(JSON.stringify(response));
    });
//启动服务
    http.listen(3000, function(){
        log.info('listening on *:3000');
    });
};
