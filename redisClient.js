/**
 * redisClient
 * Created by leason on 2017/6/3.
 */
var redis = require('redis');
var config = require('./config');
var log = require("./log").logger("redis");
//域名空间leason的redis连接
var redisClientPub = redis.createClient(config.redis_config.port,config.redis_config.host);
redisClientPub.on("error", function (err) {
    log.error("redisClientPub " + err);
});
redisClientPub.on('ready',function(err){
    log.info('redisClientPub ready');
});


//域名空间leasonList的redis连接
var redisClientList = redis.createClient(config.redis_config.port,config.redis_config.host);
redisClientList.on("error", function (err) {
    log.error("redisClientList " + err);
});
redisClientList.on("ready", function (err) {
    log.info("redisClientList ready");
});

//本身服务数据操作redis连接
var redisClientInfo = redis.createClient(config.redis_config.port,config.redis_config.host);
redisClientInfo.on("error", function (err) {
    log.error("redisClientInfo " + err);
});
redisClientInfo.on("ready", function (err) {
    log.info("redisClientInfo ready");
});

exports.redisClientPub = redisClientPub;
exports.redisClientList = redisClientList;
exports.redisClientInfo = redisClientInfo;