// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init()
const db = cloud.database();


// 云函数入口函数
exports.main = async (event, context) => {
  const MAX_LIMIT = 100;
  const countResult = await db.collection('movie_time').where({active: 1}).count();
  const total = countResult.total;
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100);
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('movie_time').where({ active: 1 }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get();
    tasks.push(promise);
  }
  return await Promise.all(tasks).then(res => {
    return res.reduce((data, item) => {
      data = data.concat(item.data);
      return data;
    }, []);
  });
}