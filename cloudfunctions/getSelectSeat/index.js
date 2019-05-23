// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  const db = cloud.database();
  const MAX_LIMIT = 100;
  const searchParam = { sold: 1, 'movie_time_id': event.movieTimeId};
  const countResult = await db.collection('seat_map').where(searchParam).count();

  const total = countResult.total;
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100);
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('seat_map').where(searchParam).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get();
    tasks.push(promise);
  }
  return await Promise.all(tasks).then(res => {
    let map = [];
    res.forEach(el => {
      map = map.concat(el.data);
    });
    return map;
  });
}