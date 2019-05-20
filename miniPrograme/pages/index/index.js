const app = getApp();
wx.cloud.init();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scale: 1,
    top: 0,
    height: 300,
    originHeight: 300,
    row: [],
    col: [],
    seatMap: [],
    seatItemWidth: 0,
    seatItemHeight: 0,
    availableUrl: './available.png',
    selectUrl: './select.png',
    soldUrl: './sold.png',
    imageSize: 0,
    areaHeight: 0,
    padding: 0,
    userInfo: null,
    hasUserInfo: false
  },
  // 座位区域放大缩小时
  seatScale(event) {
    let {
      x,
      y,
      scale
    } = event.detail;
    this.setData({
      height: this.data.originHeight * scale,
      top: y
    });
  },
  // 座位区域移动时，手指滑动
  seatChange(event) {
    let {
      x,
      y,
      scale
    } = event.detail;
    this.setData({
      top: y
    });
  },
  // 选中座位
  select(event) {
    let {
      id,
      index,
      seat,
      sold
    } = event.currentTarget.dataset;
    let url = `seatMap[${index}].iconUrl`;
    let soldValue = `seatMap[${index}].sold`;
    if (sold == 0 || sold == 2) {
      this.setData({
        [url]: sold == 0 ? this.data.selectUrl : this.data.availableUrl,
        [soldValue]: sold == 0 ? 2 : 0 // 选中状态
      });
    }
  },
  // 设置行列信息
  setSeatParam(rowCount, colCount) {
    let row = [];
    for (let i = 0; i < rowCount; i++) {
      row.push({
        key: i
      });
    }
    let col = [];
    for (let i = 0; i < colCount; i++) {
      col.push({
        key: i
      });
    }
    return {
      row,
      col
    };
  },
  onLoad: function(options) {
    // 判断是否已经获取授权
    // if (app.globalData.userInfo == null) {
    //   // 跳转授权
    //   wx.redirectTo({
    //     url: '../auth/index',
    //   });
    // } else {
      let _this = this;
      // 选座区域的宽高
      let res1 = wx.getSystemInfoSync();
      let padding = res1.windowWidth > 400 ? 25 : 20;
      let areaWidth = res1.windowWidth - padding * 2;
      let areaHeight = res1.windowHeight - 20 - 60 - 170;
      if (areaHeight > areaWidth * 1.5) {
        areaHeight = areaWidth * 1.5;
      }
      this.setData({
        padding,
        areaHeight,
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });
      // 云函数测试
      wx.cloud.callFunction({
        // 云函数名称
        name: 'getSeatParam'
      }).then(res => {
        // console.log(res);
        // 行列数据
        let seatParam = res.result.seatParam;
        let rowCount = seatParam.rowCount;
        let colCount = seatParam.colCount;
        let seatParamObj = _this.setSeatParam();

        // 设置每个座位view的宽高
        let seatItemWidth = areaWidth / colCount;
        let seatItemHeight = areaHeight / rowCount;

        // 沙发图标的大小
        let min = seatItemHeight > seatItemWidth ? seatItemWidth : seatItemHeight;
        let imageSize = 0;
        if (min > 35) {
          imageSize = 25;
        } else if (min < 20) {
          imageSize = min - 3;
        } else {
          imageSize = min - 10;
        }

        // 座位表
        let seatMap = res.result.seatMap;
        seatMap.forEach(element => {
          element.iconUrl = element.sold == 1 ? _this.data.soldUrl : _this.data.availableUrl;
        });

        _this.setData({
          ...seatParamObj,
          seatMap,
          imageSize,
          seatItemWidth,
          seatItemHeight,
          padding
        });
      });
    // }



  },

})