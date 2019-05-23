// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  // const wxContext = cloud.getWXContext();
  const db = cloud.database();
  // 查询参数
  const {
    phone,
    movieTimeId
  } = event;
  return await db.collection('sign_user').where({
    phone: phone,
    'movie_time_id': movieTimeId,
    'is_select': 0
  }).get();
}