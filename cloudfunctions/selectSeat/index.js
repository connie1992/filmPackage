// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  const db = cloud.database();
  let {
    selectInfo,
    time,
    nickName
  } = event;
  let phoneArr = JSON.parse(selectInfo);
  const tasks = [];
  const _ = db.command;
  phoneArr.forEach(item => {
    console.log(item);
    const promise = db.collection('seat_map').where({
      '_id': _.in(item.ids)
    }).update({
      data: {
        sold: 1,
        phone: item.phone,
        'nick_name': nickName,
        time
      }
    });
    tasks.push(promise);
  });
  try {
    return await Promise.all(tasks).then(res => {
      return true;
    });
  } catch (e) {
    console.log(e);
    return await false;
  }
}