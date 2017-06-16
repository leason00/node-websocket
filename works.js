/**
 * master进程
 * Created by leason on 2017/6/7.
 */
var log4js = require("./log");
var cluster = require('cluster');
var cpus = require('os').cpus();
var redisClient = require('./redisClient');
redisClient.redisClientInfo.set("userNum", 0);
var i = 0;
if (cluster.isMaster) {
    log4js.configure("master");
    var log_master = log4js.logger("master");
    cpus.forEach(function(){
        cluster.fork();
    });
    cluster.on('exit', function(worker, code, signal) {
        console.log(code);
        console.log(signal);
        console.log('worker ' + worker.process.pid + ' died');
        cluster.fork();
    });
    cluster.on('listening', function(worker, address) {
        log_master.info("A worker with #"+worker.id+" is now connected to " + address.address + ":" + address.port);
    });
    Object.keys(cluster.workers).forEach(function (id) {
        cluster.workers[id].on('message', function (msg) {
            console.log('[master] ' + 'received msg:' + msg + 'from worker' + id);
            if(msg == 'add'){
                ++i;
                redisClient.redisClientInfo.set("userNum", i);
            }else if(msg == 'reduce'){
                --i;
                redisClient.redisClientInfo.set("userNum", i);
            }
        });
    });
} else {
    log4js.configure("worker");
    var log_master = log4js.logger("worker_" + cluster.worker.id);
    log_master.info(cluster.worker.process.pid);
    require('./index').worker(cluster.worker.id +'#'+cluster.worker.process.pid,log_master);
}