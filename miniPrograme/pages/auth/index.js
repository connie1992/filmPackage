const app = getApp();
// miniPrograme/pages/auth/index.wxml.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  }
})