// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();
const db = cloud.database();

function getSeatParam(id) {
  return new Promise(resolve => {
    db.collection('movie_time').where({'_id': id}).get().then(res => {
      resolve(res.data[0]);
    });
  });
}

async function getSeatMap(id) {
  const MAX_LIMIT = 100;
  const param = {'movie_time_id': id};
  const countResult = await db.collection('seat_map').where(param).count();
  const total = countResult.total;
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100);
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('seat_map').where(param).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get();
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

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  let {movieTimeId} = event;
  return await Promise.all([getSeatParam(movieTimeId), getSeatMap(movieTimeId)]).then((res) => {
    return {
      seatParam: res[0],
      seatMap: res[1]
    };
  });
}