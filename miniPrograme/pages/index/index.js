import Toast from '../../components/vant/toast/toast.js';
import { formatTime } from '../../utils/util.js';
let zhenzisms = require('../../utils/zhenzisms.js');
let apiUrl = "https://sms_developer.zhenzikj.com";
let appId = '101584';
let appSecret = '3e0e9d1f-b327-452e-9163-96ba89f4ac0c';
zhenzisms.client.init(apiUrl, appId, appSecret);
const app = getApp();
wx.cloud.init();
let count = 30;
let interval = 0;
// 电影场次的ID
const movieTimeId = "5ce615d61b9d07166af30504";
let selectSeat = [];
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
    newPhone: '',
    phoneErrorMsg: '',
    // 验证码
    sms: '',
    smsErrorMsg: '',
    smsDisabled: false,
    smsBtnText: '发送验证码',
    // 可以选择的座位数量
    selectAmount: 0,
    submitDisabled: true 

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
    let item = event.currentTarget.dataset;
    let soldValue = `seatMap[${item.index}].sold`;
    if (item.sold == 0) {
      // 选中
      this.setData({
        [soldValue]: 2 
      });
      selectSeat.push(item);
    } else if (item.sold == 2) {
      // 取消选中
      this.setData({
        [soldValue]: 0 // 选中状态
      });
      for (let i = 0; i < selectSeat.length; i++) {
        if (selectSeat[i].id == item.id) {
          selectSeat.splice(i, 1);
          break;
        }
      }
    }
    if (selectSeat.length > 0 && this.data.submitDisabled) {
      this.setData({submitDisabled: false});
    } else if (selectSeat.length == 0 && !this.data.submitDisabled) {
      this.setData({ submitDisabled: true });
    }
  },
  // 添加手机号
  addPhone() {
    clearInterval(interval);
    this.setData({
      smsDisabled: false,
      smsBtnText: '发送验证码',
      newPhone: '15625264468',
      sms: '1',
      smsErrorMsg: '',
      phoneErrorMsg: '',
      show: true
    });
  },
  // 刪除手机号
  deletePhone(event) {
    let index = event.currentTarget.dataset.index;
    let removeAmount = this.data.phone[index].amount;
    let phoneArr = this.data.phone;
    phoneArr.splice(index, 1);
    for (let i = index; i < phoneArr.length; i++) {
      phoneArr[i].index = index++;
    }
    this.setData({
      phone: phoneArr,
      selectAmount: this.data.selectAmount - removeAmount
    });
  },
  // 手机号输入
  newPhoneChange(event) {
    this.setData({
      newPhone: event.detail
    });
  },
  phoneBlur() {
    this.checkPhone();
  },
  checkPhone() {
    let rexp = /^1\d{10}$/;
    if (!rexp.test(this.data.newPhone)) {
      this.setData({ phoneErrorMsg: '请输入正确格式的手机号' });
      return false;
    } else {
      this.setData({ phoneErrorMsg: '' });
      return true;
    }
  },
  // 验证码输入
  smsChange(event) {
    this.setData({
      sms: event.detail
    });
  },
  // 发送验证码
  sendVerifyCode() {
    // 校验手机号是否是正确的格式
    let phoneOK = this.checkPhone();
    if (phoneOK) {
      // 判断该手机是否已经添加
      let item = this.data.phone.find(item => item.text == this.data.newPhone);
      if (item) {
        this.setData({phoneErrorMsg: '该手机号已添加'});
      } else {
        let _this = this;
        console.log(`----${this.data.newPhone} 发送验证码-----`);
        zhenzisms.client.sendCode(function (res) {
          // 发送成功
          _this.setData({
            smsDisabled: true
          });
          count = 30;
          interval = setInterval(() => {
            _this.setData({
              smsBtnText: `${count--}秒`
            });
            if (count == 0) {
              _this.setData({
                smsDisabled: false,
                smsBtnText: '发送验证码'
              });
              clearInterval(interval);
            }
          }, 1000);
        }, this.data.newPhone, '小五提示您~ 验证码为：{code}', '', 600, 4);
      }
    }
  },
  confirm() {
    if (this.data.sms == '') {
      this.setData({
        smsErrorMsg: '请输入验证码'
      });
    } else {
      // let result = zhenzisms.client.validateCode(this.data.newPhone, this.data.sms);
      let result = "ok";
      let smsErrorMsg = '';
      if (result == 'ok') {
        this.getSelectSeat();
      } else if (result == 'code_expired') {
        smsErrorMsg = '验证码过期';
      } else {
        smsErrorMsg = '验证码错误';
      }
      this.setData({smsErrorMsg});
    }

  },
  // 根据手机号获取可以选择的座位数量
  // 添加座位的时候
  getSelectSeat() {
    let _this = this;
    wx.showLoading();
    wx.cloud.callFunction({
      name: 'getSeatAmount',
      data: {movieTimeId, phone: this.data.newPhone}
    }).then(res => {
      wx.hideLoading();
      let data = res.result.data;
      if (data.length == 0) {
        _this.setData({phoneErrorMsg: "该手机号未报名或者已选座"});
      } else {
        let sumAmount = data.reduce((sum, item) => {
          return sum + item.amount;
        }, 0);
        let phoneArr = _this.data.phone;
        phoneArr.push({
          index: phoneArr.length,
          text: _this.data.newPhone,
          amount: sumAmount
        });
        _this.setData({ show: false, phone: phoneArr, selectAmount: _this.data.selectAmount + sumAmount });
        Toast(`该手机号可以选座数量为：${sumAmount}个`);
      }
    });
  },

  // 刷新座位选择情况，返回已经选择的座位数据
  refreshSeatSelect() {
    let _this = this;
    wx.showLoading();
    wx.cloud.callFunction({
      name: 'getSelectSeat',
      data: { movieTimeId }
    }).then(res => {
      wx.hideLoading();
      let data = res.result;
      let setData = {};
      data.forEach(item => {
        // 过滤掉已经是选中状态的座位数据
        if (_this.data.seatMap[item.index].sold != 1) {
          console.log(item);
          let key = `seatMap[${item.index}].sold`;
          setData[key] = item.sold;
        }
      });
      this.setData(setData);
    });
  },

  // 判断选择的座位是否是相连的
  checkSelectSeat() {

  },
  // 选择座位，保存手机号和验证码，并且设置手机号的状态为 已选择
  setSelectSeat(){
    if (this.data.phone.length == 0) {
      Toast.fail("请先添加报名手机号码");
    } else if (selectSeat.length < this.data.selectAmount) {
      Toast.fail(`您可选择${this.data.selectAmount}个座位，目前只选择了${selectSeat.length}个`);
    } else {
      let userInfo = wx.getStorageSync("userInfo");
      // 按照组合选座的情况去拆分座位
      let index = 0;
      let selectInfo = this.data.phone.map(item => {
        let ids = [];
        for (let i = index; i < index + item.amount; i++) {
          ids.push(selectSeat[i].id);
        }
        index += item.amount;
        return {phone: item.text, ids};
      });
      let params = { nickName: userInfo.nickName, time: formatTime(new Date()), selectInfo};
      wx.showLoading();
      let _this = this;
      wx.cloud.callFunction({
        name: 'selectSeat',
        data: params
      }).then(res => {
        wx.hideLoading();
        if (res.result == 1) {
          Toast.success("选座成功");
          _this.refreshSeatSelect();
        } else if (res.result == 2) {
          // 占座失败
        } else {
          // 后台处理报错
        }
      });



    }
   




  },
  
  // 下拉刷新最新的选座状态



  onLoad: function (options) {
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
    wx.showLoading();
    wx.cloud.callFunction({
      // 云函数名称
      name: 'getSeatParam',
      data: {movieTimeId}
    }).then(res => {
      wx.hideLoading();
      // console.log(res);
      // 行列数据
      let seatParam = res.result.seatParam;
      let rowCount = seatParam.rowCount;
      let colCount = seatParam.colCount;

      // 设置每个座位view的宽高
      let seatItemWidth = (areaWidth - 2 * this.data.seatPadding) / colCount;
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
      let seatMap = res.result.seatMap.map(item => {
        return {
          id: item.id,
          sold: item.sold,
          x: item.x,
          y: item.y,
          index: item.index,
          seat: item.seat
        };
      });
      _this.setData({
        seatMap,
        imageSize,
        seatItemWidth,
        seatItemHeight,
        padding
      });
    });
  },

})