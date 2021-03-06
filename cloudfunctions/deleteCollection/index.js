// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database();
  // return db.collection('seat_map').where({sold: 0}).remove();
  return await db.collection("seat_map").where({sold: 1}).update({
    data: {
      sold: 0
    }
  });
}
