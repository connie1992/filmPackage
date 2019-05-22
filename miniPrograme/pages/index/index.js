let zhenzisms = require('../../utils/zhenzisms.js');
let apiUrl = "https://sms_developer.zhenzikj.com";
let appId = '101584';
let appSecret = '3e0e9d1f-b327-452e-9163-96ba89f4ac0c';
zhenzisms.client.init(apiUrl, appId, appSecret);
const app = getApp();
wx.cloud.init();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 用于计算排号位置
    scale: 1,
    top: 0,
    height: 300,
    originHeight: 300,
    // 座位数据
    seatMap: [],
    seatItemWidth: 0,
    seatItemHeight: 0,
    // 座位状态图片
    availableUrl: './sofa.png',
    selectUrl: './select.png',
    soldUrl: './sold.png',
    imageSize: 0,
    areaHeight: 0,
    padding: 0,
    userInfo: null,
    hasUserInfo: false,
    totalHeight: app.globalData.totalHeight,
    seatPadding: 5,
    // 手机号弹窗
    phone: [],
    show: false,
    newPhone: '123',
    sms: '',
    smsErrorMsg: ''
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
  // 添加手机号
  addPhone() {
    this.setData({newPhone: '', sms: '', show: true});
  },
  // 刪除手机号
  deletePhone(event) {
    let index = event.currentTarget.dataset.index;
    let phoneArr = this.data.phone;
    phoneArr.splice(index, 1);
    for (let i = index; i < phoneArr.length; i++) {
      phoneArr[i].index = index++;
    }
    this.setData({phone: phoneArr}); 
  },
  newPhoneChange(event) {
    this.setData({newPhone: event.detail});
  },
  smsChange(event) {
    this.setData({sms: event.detail});
  },
  // 发送验证码
  sendVerifyCode() {
    this.setData({smsErrorMsg: ''});
    zhenzisms.client.sendCode(function(res){
      console.log(res.data);
    }, '15625264468', '小五提示您~ 验证码为：{code}', '1234567890', 600, 4);
  },
  confirm() {
    let result = zhenzisms.client.validateCode('15625264468', this.data.sms);
    console.log('验证码校验的结果为:' + result);
    // result = 'ok';
    if (result == 'ok') {
      this.setData({smsErrorMsg: ''});
      let phoneArr = this.data.phone;
      phoneArr.push({index: phoneArr.length, text: this.data.newPhone});
      this.setData({phone: phoneArr, show: false}); 
    } else if (result == 'code_expired') {
      console.log('过期');
      // 验证码过期
      this.setData({smsErrorMsg: '验证码过期'});
    } else {
      console.log('错误');
      // 验证码错误
      this.setData({smsErrorMsg: '验证码错误'});
    }
  },
  // 根据手机号获取可以选择的座位数量


  // 刷新座位选择情况，返回已经选择的座位坐标


  // 选择座位


  onLoad: function(options) {
      let _this = this;
      // 选座区域的宽高
      let res1 = wx.getSystemInfoSync();
      let padding = res1.windowWidth > 400 ? 25 : 20;
      let areaWidth = res1.windowWidth - padding * 2;
      let areaHeight = res1.windowHeight - app.globalData.statusBarHeight - app.globalData.toolbarHeight - 20 - 60 - 170;
      if (areaHeight > areaWidth * 1.5) {
        areaHeight = areaWidth * 1.5;
      }
      this.setData({
        padding,
        areaHeight
      });
      // // 云函数测试
      // wx.cloud.callFunction({
      //   // 云函数名称
      //   name: 'getSeatParam'
      // }).then(res => {
      //   // console.log(res);
      //   // 行列数据
      //   let seatParam = res.result.seatParam;
      //   let rowCount = seatParam.rowCount;
      //   let colCount = seatParam.colCount;

      //   // 设置每个座位view的宽高
      //   let seatItemWidth = (areaWidth - 2 * this.data.seatPadding) / colCount;
      //   let seatItemHeight = areaHeight / rowCount;

      //   // 沙发图标的大小
      //   let min = seatItemHeight > seatItemWidth ? seatItemWidth : seatItemHeight;
      //   let imageSize = 0;
      //   if (min > 35) {
      //     imageSize = 25;
      //   } else if (min < 20) {
      //     imageSize = min - 3;
      //   } else {
      //     imageSize = min - 10;
      //   }

      //   // 座位表
      //   let seatMap = res.result.seatMap;
      //   seatMap.forEach(element => {
      //     element.iconUrl = element.sold == 1 ? _this.data.soldUrl : _this.data.availableUrl;
      //   });

      //   _this.setData({
      //     seatMap,
      //     imageSize,
      //     seatItemWidth,
      //     seatItemHeight,
      //     padding
      //   });
      // });
  },

})