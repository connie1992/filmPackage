// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();

function getSeatParam() {
  return new Promise(resolve => {
    const db = cloud.database();
    db.collection('seat_param').get().then(res => {
      resolve(res.data[0]);
    });
  });
}

async function getSeatMap() {
  const db = cloud.database();
  const MAX_LIMIT = 100;
  const countResult = await db.collection('seat_map').count();
  const total = countResult.total;
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100);
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('seat_map').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get();
    tasks.push(promise);
  }
  return await Promise.all(tasks).then(res => {
    let map = [];
    res.forEach(el => {
      map = map.concat(el.data);
    });
    // console.log('map.....');
    // console.log(map);
    return map;
  });
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  return await Promise.all([getSeatParam(), getSeatMap()]).then((res) => {
    // console.log(res);
    return {
      seatParam: res[0],
      seatMap: res[1]
    };
  });
}