// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();
const db = cloud.database();

const LOCK = "lock";

function getPromise(index) {
  return db.collection("seat_map").where({
    sold: 1
  }).get().catch(e => {
    return {index};
  }); 
}

function loopSet(res) {
  console.log('数据库操作结果：……');
  console.log(res);
  let tasks = [];
  res.forEach(item => {
    if (item.index) {
      tasks.push(getPromise(item.index));
    }
  });
  return tasks;
}

// 云函数入口函数
exports.main = async(event, context) => {
  let tasks = [];
  for (let i = 0; i < 1; i++) {
    tasks.push(getPromise(i));
  }
  let res = await Promise.all(tasks);
  while(true) {
    tasks = loopSet(res);
    if (tasks.length == 0) {
      break;
    } else {
      res = await Promise.all(tasks);
    }
  } 
  return res;
}