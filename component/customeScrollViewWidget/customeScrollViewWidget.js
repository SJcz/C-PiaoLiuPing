// component/customeScrollViewWidget/customeScrollViewWidget.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    chatList: Array,
    swiperHeight: Number
  },

  /**
   * 组件的初始数据
   */
  data: { 
    voiceIcon: 'http://120.78.124.36/wxxcx/C_PLP/bofangshengyin.png'

  },

  /**
   * 组件的方法列表
   */
  methods: {
    //点击播放语音
    playVoice: function (e) {
      var path = e.currentTarget.dataset.path;
      wx.playVoice({
        filePath: path
      });
    },
    //点击预览图片
    viewFullPicture: function (e) {
      var path = e.currentTarget.dataset.path;
      wx.previewImage({
        current: path,
        urls: [path]
      });
    }
  }
})
