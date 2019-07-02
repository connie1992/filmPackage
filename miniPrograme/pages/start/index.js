const app = getApp();
// miniPrograme/pages/auth/index.wxml.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    height: 0,
    show: false,
    movieData: [],
    columns: [],
    value: "",
    id: ''
  },

  getUserInfo: function (e) {
    // 判断缓存里有没有用户信息
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.navigateTo({
        url: `../index/index?id=${this.data.id}`
      });
    } else {
      let that = this;
      wx.showLoading();
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
                      wx.hideLoading();
                      app.globalData.userInfo = infoRes.userInfo;
                      wx.setStorageSync('userInfo', infoRes.userInfo);
                      wx.navigateTo({
                        url: `../index/index?id=${that.data.id}`
                      });
                    }
                  });
                }
              }
            })
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

  selectMovieTime() {
    this.setData({ show: true });
  },
  onCancel(){
    this.setData({ show: false });
  },
  onConfirm(event) {
    let {index, value} = event.detail;
    this.setData({
      id: this.data.movieData[index]._id,
      value,
      show: false
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      height: app.globalData.totalHeight
    });
    wx.showLoading();
    // 获取场次
    wx.cloud.callFunction({
      // 云函数名称
      name: 'getMovieTime'
    }).then(res => {
      wx.hideLoading();
      let columns = res.result.map(item => item.name);
      this.setData({movieData: res.result, columns, value: columns[0], id: res.result[0]._id});
    });
  }
})