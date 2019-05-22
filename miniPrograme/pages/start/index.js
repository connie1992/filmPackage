const app = getApp();
// miniPrograme/pages/auth/index.wxml.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    height: 0
  },

  getUserInfo: function (e) {
    // 判断缓存里有没有用户信息
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.redirectTo({
        url: '../index/index'
      });
    } else {
      let that = this;
      wx.login({
        success: function (loginRes) {
          // 1. 获取用户code
          if (loginRes) {
            console.log('1.code:', loginRes);
            wx.setStorageSync('code', loginRes.code);
            wx.getSetting({
              success: function (res) {
                if (res.authSetting['scope.userInfo']) {
                  // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                  // 获取用户信息
                  wx.getUserInfo({
                    withCredentials: true, //非必填  默认为true
                    success: function (infoRes) {
                      app.globalData.userInfo = infoRes.userInfo;
                      wx.setStorageSync('userInfo', infoRes.userInfo);
                      wx.redirectTo({
                        url: '../index/index'
                      });
                    }
                  });
                }
              }
            })
          } else {

          }
        }
      });


    }

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
    this.setData({
      height: app.globalData.totalHeight
    });
  }
})