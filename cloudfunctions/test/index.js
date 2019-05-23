// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  const db = cloud.database();
  const _ = db.command;
  // return await db.collection('test').add({data: {haha: 'chenhuogu111'}});
  // return await db.collection('test').where({ '_id': _.in(["c0a3987b5ce64fc103e8a9452cb869c0", "a8872575-5acf-407b-9918-33f77dc48c1a"]) }).update({ data: { 'haha': 'connie123456' } });
  let arr = ['5ce615d61b9d07166af30504212', '5ce615d61b9d07166af30504217'];
  // return await db.collection('seat_map').where({
  //   '_id': _.in(arr)
  // }).update({
  //   data: {
  //     'nick_name': 'connie'
  //   }
  // });
  return await db.collection('seat_map').where({
    'id': _.in(arr)
  }).get();

}