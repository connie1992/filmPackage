// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();

const LOCK = "lock";

// 初始化连接redis
const redis = require('redis');
const client = redis.createClient(6379, '10.108.7.228', {
  password: "csot.888"
});


// 尝试锁定
function tryLock() {
  return new Promise(resolve => {
    // 设置锁定状态
    client.set(LOCK, "1", 'NX', 'EX', 20, function(err, reply) {
      if (err) {
        resolve(false);
      } else {
        resolve(reply == "ok" || reply == "OK");
      }
    });
  });
}

// 循环锁定
function lockLoop() {
  return new Promise((resolve, reject) => {
    let count = 10;
    let interval = setInterval(() => {
      tryLock().then(res => {
        isLock = res;
        console.log(`--循环获取锁定状态：${count}: ${isLock}-----`);
        if (isLock || count == 0) {
          clearInterval(interval);
          resolve(isLock);
        } else {
          count--;
        }
      });
    }, 1000);
  });
}

// 获取值
function getValue(key) {
  return new Promise((resolve, reject) => {
    console.log(`---查询锁定状态：${key}------`);
    client.get(key, function(err, res) {
      console.log(`锁定结果为：${res}`);
      if (err) {
        reject(false);
      } else {
        if (res) {
          reject(false);
        } else {
          resolve(true);
        }
      }
    });
  });
}

// 设置值
function setValue(key) {
  return new Promise((resolve, reject) => {
    client.set(key, "1", function(err, reply) {
      if (err) {
        reject(false);
      } else {
        resolve(true);
      }
    })
  });
}

// 删除值
function delKey (key) {
  return new Promise(resolve => {
    client.del(key, function(err, reply) {
      if (err) {
        resolve(false);
      } else {
        resolve(reply);
      }
    });
  });
}

// 锁定座位
async function lockSeat(ids) {
  let result = true;
  let tasks = [];
  ids.forEach(id => {
    tasks.push(getValue(id));
  });
  let seatStatus = await Promise.all(tasks).catch(e => {
    console.log("部分座位已经被选择");
  });
  console.log(`座位可选择状态:${seatStatus}`);
  if (seatStatus) {
    let setTasks = ids.map(id => setValue(id));
    let setStatus = await Promise.all(setTasks).catch(e => {
      console.log('锁定座位失败了！');
      return false;
    });
    if (!setStatus) {
      // 如果锁定座位失败，则需要回滚，删除已经设置的key
      let delTasks = ids.map(id => delKey(id));
      Promise.all(delTasks);
    }
    return setStatus ? true : false;
  } else {
    return false;
  }
}


// 云函数入口函数
exports.main = async(event, context) => {
  let ids = ['123', '234'];
  let isLock = await tryLock();
  let success = true;
  if (!isLock) {
    isLock = await lockLoop();
    if (isLock) {
      console.log('尝试锁定成功……');
      success = await lockSeat(ids);
    } else {
      success = false;
    }
  } else {
    success = await lockSeat(ids);
  }
  console.log('占座最终结果：');
  console.log(success);
  delKey(LOCK);
  return success;

}