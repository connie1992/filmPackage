const app = getApp();
Component({
  properties: {
    show: {
      type: Boolean,
      value: true
    },
    title: {
      type: String,
      value: 'weixinHR'
    }
  },
  data: {
    statusHeight: 0,
    toolbarHeight: 0
  },
  ready: function () {
    this.setData({ statusHeight: app.globalData.statusBarHeight, toolbarHeight: app.globalData.toolbarHeight });
  },
  methods: {
    back() {
      wx.navigateBack();
    },
    home() {
      wx.switchTab({
        url: '../../pages/QA/index',
      })
    }
  }
})