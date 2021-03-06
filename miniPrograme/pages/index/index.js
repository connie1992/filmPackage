import Toast from '../../components/vant/toast/toast.js';
import { formatTime } from '../../utils/util.js';
let zhenzisms = require('../../utils/zhenzisms.js');
const apiUrl = "https://sms_developer.zhenzikj.com";
const appId = '101584';
const appSecret = '3e0e9d1f-b327-452e-9163-96ba89f4ac0c';
zhenzisms.client.init(apiUrl, appId, appSecret);
const app = getApp();
wx.cloud.init();
let count = 30;
let interval = 0;
// 电影场次的ID
let movieTimeId = "5ce615d61b9d07166af30504";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    movieInfo: {time: '', movie: '', theater: '', type: ''},
    // 用于计算排号位置
    scale: 1,
    // 座位数据
    seatMap: [],
    seatItemWidth: 0,
    seatItemHeight: 0,
    // 前面屏幕需要留出来的高度
    screenHeight: 20,
    // 座位图标信息
    imageSize: 0,
    areaHeight: 0,
    padding: 0,
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
    submitDisabled: true,
    selectSeat: [],
    // 左边表示行数的提示信息
    rowtipHeight: 0,
    rowtipTop: 20
  },
  // 座位区域放大缩小时
  seatScale(event) {
    let {
      x,
      y,
      scale
    } = event.detail;
    this.setData({
      rowtipHeight: this.data.areaHeight * scale,
      rowtipTop: y + this.data.screenHeight
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
      rowtipTop: y + this.data.screenHeight
    });
  },
  // 选中座位
  select(event) {
    let item = event.currentTarget.dataset;
    let soldValue = `seatMap[${item.index}].sold`;
    let selectSeat = this.data.selectSeat;
    if (item.sold == 0) {
      // 选中
      this.setData({
        [soldValue]: 2 
      });
      item.sold = 2;
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
    this.setData({selectSeat});
    // 设置提交按钮
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
      newPhone: '',
      sms: '',
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
         // 发送成功
         let count = 30;
         _this.setData({
          smsDisabled: true,
          smsBtnText: `${count--}秒重发`
        });
        
        interval = setInterval(() => {
          _this.setData({
            smsBtnText: `${count--}秒重发`
          });
          if (count == 0) {
            _this.setData({
              smsDisabled: false,
              smsBtnText: '发送验证码'
            });
            clearInterval(interval);
          }
        }, 1000);
        zhenzisms.client.sendCode(function (res) {
        }, this.data.newPhone, '小五提示您~ 验证码为：{code}', '', 600, 4);
      }
    }
  },
  // 校验手机号和验证码对不对
  confirm() {
    // 判断该手机号是否添加过
    if(this.data.phone.find(el => el.text == this.data.newPhone)) {
      this.setData({phoneErrorMsg: "该手机号已添加，请勿重复"});
      return ;
    }
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
          amount: sumAmount,
          sms: this.data.sms
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
    return wx.cloud.callFunction({
      name: 'getSelectSeat',
      data: { movieTimeId }
    }).then(res => {
      wx.hideLoading();
      let data = res.result;
      let setData = {};
      let newIndex = [];
      data.forEach(item => {
        newIndex.push(item.index);
        // 过滤掉已经是选中状态的座位数据
        if (_this.data.seatMap[item.index].sold != 1) {
          let key = `seatMap[${item.index}].sold`;
          setData[key] = item.sold;
        }
      });
      // 已经选中的取消选中
      _this.data.seatMap.forEach(seat => {
        if (seat.sold == 1 && newIndex.indexOf(seat.index) == -1) {
          let key = `seatMap[${seat.index}].sold`;
          setData[key] = 0;
        }
      });
      // 如果已经选择的座位已经被选择，则需要更新
      let selectSeat = _this.data.selectSeat;
      for (let i = 0; i < selectSeat.length; i++) {
        if (newIndex.indexOf(selectSeat[i].index) != -1) {
          selectSeat.splice(i--, 1);
        }
      }
      setData.selectSeat = selectSeat;
      this.setData(setData);
    });
  },

  // 判断选择的座位是否是相连的
  checkSelectSeat() {
    let selectSeat = this.data.selectSeat;
    selectSeat.forEach(item => {
      item.check = false;
    });
    let seatMap = this.data.seatMap;

    let isOk = true;
    for (let i = 0; i < selectSeat.length; i++) {
      if (selectSeat[i].check) {
        continue ;
      }
      console.log('-----start:' + i);
      let seat = selectSeat[i];
      let start = seat.x;
      let end = seat.x;
      let count = 1;
      for (let j = i + 1; j < selectSeat.length; j++) {
        if (!selectSeat[j].check && selectSeat[j].y == seat.y) {
          selectSeat[j].check = true;
          if (selectSeat[j].x < start) {
            start = selectSeat[j].x;
          } else if (selectSeat[j].x > end) {
            end = selectSeat[j].x;
          }
          count ++;
        }
      }
      // 结合座位图进行判断
      
      // 获取这一行已选择的座位范围
      let selectStart = -1;
      let selectEnd = -1;
      for (let i = 0 ; i < seatMap.length; i++) {
        if (seatMap[i].y == seat.y && seatMap[i].sold == 1) {
          if (selectStart == -1) {
            selectStart = seatMap[i].x;
          } else {
            selectEnd = seatMap[i].x;
          }
        } else if (seatMap[i].y > seat.y) {
          break;
        }
      }
      selectEnd = selectEnd == -1 ? selectStart : selectEnd;
      if (selectStart == -1 && selectEnd == -1) {
        // 这一行还没有人选择
        isOk = (count - 1) == (end - start);
      } else if (start < selectStart && end > selectEnd) {
        // 选择的座位在已选择的两边： 如：22112
        isOk = (start + count + (selectEnd - selectStart + 1) - 1) == end;
      } else if (start > selectEnd) {
        // 选择的座位在已选择的右边 如： 0001122
        isOk = start == selectEnd + 1 && (count - 1) == (end - start);
      }  else {
        // 选择的座位在已选择的右边 如： 02210000
        isOk = end + 1 == selectStart && (count - 1) == (end - start);
      }
      if (!isOk) {
        break ;
      }
    }
    return isOk;    
  },

  // 选择座位，提交保存，保存手机号和验证码，并且设置手机号的状态为 已选择
  setSelectSeat(){
    let selectSeat = this.data.selectSeat;
    if (this.data.phone.length == 0) {
      Toast.fail("请先添加报名手机号码");
    } else if (selectSeat.length < this.data.selectAmount) {
      Toast.fail(`您可选择${this.data.selectAmount}个座位，目前只选择了${selectSeat.length}个`);
    } else if (selectSeat.length > this.data.selectAmount) {
      Toast.fail(`您只能选择${this.data.selectAmount}个座位，目前选择了${selectSeat.length}个`);
    } else {
      if (!this.checkSelectSeat()) {
        Toast.fail("请选择相连座位");
        return ;
      }
      let userInfo = wx.getStorageSync("userInfo");
      // 按照组合选座的情况去拆分座位
      let index = 0;
      let selectInfo = this.data.phone.map(item => {
        let ids = [];
        for (let i = index; i < index + item.amount; i++) {
          ids.push(selectSeat[i].id);
        }
        index += item.amount;
        return {phone: item.text, ids, sms: item.sms};
      });
      let params = { nickName: userInfo.nickName, time: formatTime(new Date()), selectInfo};
      wx.showLoading();
      let _this = this;
      console.log(params);
      wx.cloud.callFunction({
        name: 'selectSeat',
        data: params
      }).then(res => {
        wx.hideLoading();
        if (res.result == 1) {
          Toast.success("选座成功");
          this.setData({selectAmount: 0, phone: []});
        } else if (res.result == 2) { 
          // 占座失败
          Toast.fail("选座失败，请重试");
        } else {
          // 占座失败
          Toast.fail("噢！座位被别人抢先一步了！请重新选择");
        }
        _this.refreshSeatSelect();
        // _this.setData({selectSeat: []});
      }, reject => {
        // console.log(reject);
        wx.hideLoading();
        Toast.fail("发生错误，请重试");
      });
    }
  },
  
  // 下拉刷新最新的选座状态
  onPullDownRefresh: function () {
    this.refreshSeatSelect().then(() => {
      // 处理完成后，终止下拉刷新
      wx.stopPullDownRefresh()
    })
  },
  onLoad: function (options) {
    console.log(this.data);
    movieTimeId = options.id;
    let _this = this;
    // 选座区域的宽高
    let res1 = wx.getSystemInfoSync();
    let padding = res1.windowWidth > 400 ? 25 : 20;
    let areaWidth = res1.windowWidth - padding * 2;
    let areaHeight = res1.windowHeight - app.globalData.statusBarHeight - app.globalData.toolbarHeight - 20 - 70 - 140 - this.data.screenHeight;
    if (areaHeight > areaWidth * 1.5) {
      areaHeight = areaWidth * 1.5;
    }
    this.setData({
      padding,
      areaHeight,
      rowtipHeight: areaHeight
    });
    // // 云函数测试
    wx.showLoading();
    wx.cloud.callFunction({
      // 云函数名称
      name: 'getSeatParam',
      data: {movieTimeId}
    }).then(res => {
      wx.hideLoading();
      console.log(res);
      // 行列数据
      let movieInfo = res.result.seatParam;
      if (!(movieInfo.time && movieInfo.colCount && movieInfo.rowCount)) {
        Toast.fail("场次信息不完整！请联系包场负责人处理");
        return ;
      }

      movieInfo.time = movieInfo.time.substring(5, movieInfo.time.length);
      let rowCount = movieInfo.rowCount;
      let colCount = movieInfo.colCount;

      // 设置每个座位view的宽高
      let seatItemWidth = (areaWidth - 2 * this.data.seatPadding) / colCount;
      let seatItemHeight = areaHeight / rowCount;
      // 调整一下座位的垂直间距，因为有的时候手机比较长，就不是很好看
      if (seatItemHeight > seatItemWidth * 1.7) {
        seatItemHeight = seatItemWidth * 1.7;
      }

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
      imageSize = imageSize - res1.windowWidth / 220;

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
        padding,
        movieInfo
      });
    });
  },

})