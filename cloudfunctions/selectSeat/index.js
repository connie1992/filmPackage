// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();

const db = cloud.database();

const LOCK = "lock";

// 初始化连接redis
const redis = require('redis');
const client = redis.createClient(18868, 'redis-18868.c1.asia-northeast1-1.gce.cloud.redislabs.com', {
  password: "Chg85857187."
});

// 尝试锁定
function tryLock() {
  return new Promise(resolve => {

    // 设置锁定状态
    client.set(LOCK, "1", 'NX', 'EX', 10, function(err, reply) {
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
        console.log('查询锁定状态失败……');
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
        console.log("锁定座位失败！");
        reject(false);
      } else {
        resolve(true);
      }
    })
  });
}

// 删除值
function delKey(key) {
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

// 数据库操作
async function dbSet(selectInfo, nickName, time, movieTimeId) {
  let _ = db.command;
  // 更新座位情况
  let tasks = selectInfo.reduce((tasks, item) => {
    const promise = db.collection('seat_map').where({
      id: _.in(item.ids)
    }).update({
      data: {
        sold: 1,
        time,
        'nick_name': nickName,
        phone: item.phone
      }
    });
    tasks.push(promise);
    return tasks;
  }, []);
  // 更新手机选座
  let phoneTasks = selectInfo.reduce((tasks, item) => {
    const promise = db.collection('sign_user').where({
      "movie_time_id": movieTimeId,
      phone: item.phone
    }).update({
      data: {
        "is_select": 1
      }
    });
    tasks.push(promise);
  }, []);
  return await Promise.all(tasks.concat(phoneTasks)).catch(e => {
    console.log(e);
    return false
  });
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

  // 测试
  // success = true;


  delKey(LOCK);
  if (success) {
    // 执行数据库操作
    let res = await dbSet(selectInfo, nickName, time, movieTimeId);
    console.log('数据库更新成功');
    console.log(res);
  }
  return success;
}