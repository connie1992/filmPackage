// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();

const db = cloud.database();
const _ = db.command;

const LOCK = "lock";

// 成功
const SUCCESS = 1;
// 发生错误，可以重试
const ERROR = 2;
// 选的座位已经被占了
const FAIL = 0;

// 初始化连接redis
const redis = require('redis');
// const client = redis.createClient(18868, 'redis-18868.c1.asia-northeast1-1.gce.cloud.redislabs.com', {
//   password: "Chg85857187."
// });
const client = redis.createClient(6379, '106.52.125.131', {
  password: "12345"
});

// 尝试锁定
function tryLock() {
  return new Promise(resolve => {
    // 设置锁定状态
    client.set(LOCK, "1", 'NX', 'EX', 10, function(err, reply) {
      if (err) {
        resolve(ERROR);
      } else {
        resolve(reply == "ok" || reply == "OK" ? SUCCESS : FAIL);
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
        if (isLock == SUCCESS || count == 0) {
          clearInterval(interval);
          resolve(isLock);
        } else {
          count--;
        }
      });
    }, 1000);
  });
}

// redis获取座位锁定状态
function getValue(key) {
  return new Promise((resolve, reject) => {
    console.log(`---查询锁定状态：${key}------`);
    client.get(key, function(err, res) {
      console.log(`锁定结果为：${res}`);
      if (err) {
        console.log('查询锁定状态失败……');
        reject(ERROR);
      } else {
        if (res) {
          reject(FAIL);
        } else {
          resolve(SUCCESS);
        }
      }
    });
  });
}

// redis锁定座位
function setValue(key) {
  return new Promise((resolve, reject) => {
    client.set(key, "1", function(err, reply) {
      if (err) {
        console.log("锁定座位失败！");
        reject(ERROR);
      } else {
        resolve(SUCCESS);
      }
    })
  });
}

// redis删除值，释放座位
function delKey(key) {
  return new Promise(resolve => {
    client.del(key, function(err, reply) {
      if (err) {
        resolve(ERROR);
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
    return e;
  });
  console.log(`座位可选择状态:${seatStatus}`);
  if (seatStatus != FAIL && seatStatus != ERROR) {
    let setTasks = ids.map(id => setValue(id));
    let setStatus = await Promise.all(setTasks).catch(e => {
      console.log('锁定座位失败了！');
      return e;
    });
    if (setStatus == ERROR) {
      // 如果锁定座位失败，则需要回滚，删除已经设置的key
      let delTasks = ids.map(id => delKey(id));
      Promise.all(delTasks);
    }
    return setStatus;
  } else {
    return seatStatus;
  }
}

function getSeatPromise(info, index, nickName, time, movieTimeId) {
 
  return db.collection('seat_map').where({
    id: _.in(info.ids)
  }).update({
    data: {
      sold: 1,
      time,
      'nick_name': nickName,
      phone: info.phone
    }
  }).catch(e => {
    return {
      type: "seat",
      index
    };
  });
}

function getPhonePromise(info, index, movieTimeId) {
  return db.collection('sign_user').where({
    "movie_time_id": movieTimeId,
    phone: info.phone
  }).update({
    data: {
      "is_select": 1,
      sms: info.sms
    }
  }).catch(e => {
    return {
      type: "phone",
      index
    };
  });
}

// 数据库操作
async function dbSet(selectInfo, nickName, time, movieTimeId) {
  let _ = db.command;
  // 更新座位情况
  let seatTasks = selectInfo.reduce((tasks, item, index) => {
    const promise = getSeatPromise(item, index, nickName, time, movieTimeId );
    tasks.push(promise);
    return tasks;
  }, []);
  // 更新手机选座
  let phoneTasks = selectInfo.reduce((tasks, item, index) => {
    const promise = getPhonePromise(item, index, movieTimeId);
    tasks.push(promise);
    return tasks
  }, []);
  return await Promise.all(seatTasks.concat(phoneTasks));
}

function loopSetSeat(selectInfo, res, nickName, time, movieTimeId) {
  let retryTasks = [];
  res.forEach(item => {
    if (item.index && item.type) {
      // 失败的任务
      let promise = null;
      const info = selectInfo[item.index];
      if (item.type == "seat") {
        promise = getSeatPromise(info, item.index, nickName, time, movieTimeId);
      } else {
        promise = getPhonePromise(info, item.indx, movieTimeId);
      }
      retryTasks.push(promise);
    }
  });
  return retryTasks;
}

// 云函数入口函数
exports.main = async(event, context) => {
  let {
    selectInfo,
    nickName,
    time,
    movieTimeId
  } = event;
  let ids = selectInfo.reduce((idArr, item) => {
    return idArr.concat(item.ids)
  }, []);
  let isLock = await tryLock();
  // 选座结果
  let result = SUCCESS;
  if (isLock != SUCCESS) {
    isLock = await lockLoop();
    if (isLock == SUCCESS) {
      console.log('尝试锁定成功……');
      result = await lockSeat(ids);
    } else {
      // 如果失败的话需要获取详细的信息，发生错误 or 无法获取锁
      result = isLock;
    }
  } else {
    console.log('尝试锁定成功……');
    result = await lockSeat(ids);
  }

  console.log('占座最终结果：');
  console.log(result);

  // 测试
  // success = true;

  delKey(LOCK);
  if (result != ERROR && result != FAIL) {
    // 执行数据库操作
    let res = await dbSet(selectInfo, nickName, time, movieTimeId);
    while(true) {
      let tasks = loopSetSeat(selectInfo, res, nickName, time, movieTimeId);
      if (tasks.length == 0) {
        console.log("数据库更新成功！");
        break;
      } else {
        console.log('部分数据库请求没有执行，重新执行……');
        res = await Promise.all(tasks);
      }
    }
    return SUCCESS;
  } else {
    return result;
  }
}