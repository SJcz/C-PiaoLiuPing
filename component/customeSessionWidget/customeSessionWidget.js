// component/customeSessionWidget.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    // 输入组件的图标
    voiceIcon: "http://120.78.124.36/wxxcx/C_PLP/shengyin.png",
    keyboardIcon: "http://120.78.124.36/wxxcx/C_PLP/keyboard_icon.png",
    pictureIcon: "http://120.78.124.36/wxxcx/C_PLP/tupian.png",

    //录音中 取消发送的图标
    statusIcon: "",
    voicingIcon: "http://120.78.124.36/wxxcx/C_PLP/luyinzhong.png",
    cancelSendIcon: "http://120.78.124.36/wxxcx/C_PLP/quxiaofasong.png",

    tip: "",
    tip1: "手指上滑，取消发送",
    tip2: "松开手指, 取消发送",

    keyboardTip: "",
    keyboardTip1: "按住 说话",
    keyboardTip2: "松开 结束",

    selectedInputWay: 0, //选择的输入方式 只能是0和1 0:键盘  1:语音
    startY: 0, //按住说话 初始触摸位置
    spaceDistance: -100,  //出现 取消发送的 Y轴距离间隔
    showRecordStatusView: false, //显示 录音状态的 view
    cancelSendStatus: false, //是否为 取消发送 状态

    hasRecordSetting: false, //是否拥有录音权限

    inputContent: "", //输入框值
  },

  /**
   * 组件的方法列表
   */
  methods: {
    checkSetting: function () {
      //如果 当前输入方式是文字输入，点击icon时(也就是准备切换语音输入), 提前查询权限
      var that = this;
      return new Promise((resolve, reject) => {
        if (that.data.selectedInputWay == 0) {
          wx.getSetting({
            success(res) {
              if (!res.authSetting['scope.record']) {
                wx.authorize({
                  scope: 'scope.record',
                  success() {
                    // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
                    console.log("获取录音权限成功");
                    that.data.hasRecordSetting = true;
                    resolve();
                  },
                  fail: (err) => {
                    console.log(err);
                    reject();
                  }
                })
              } else {
                that.data.hasRecordSetting = true;
                resolve();
              }
            },
            fail: (err) => {
              console.log(err);
              reject();
            }
          });
        }
      });
    },
    //输入框值改变事件
    changeInputContent: function (e) {
      this.setData({
        inputContent: e.detail.value
      });
    },
    changeInputWay: function () {
      var that = this;
      if (!this.data.hasRecordSetting) {
        this.checkSetting().then(() => {
          that.setData({
            selectedInputWay: this.data.selectedInputWay == 0 ? 1 : 0,
            keyboardTip: this.data.keyboardTip1
          });
        }).catch(() => {
          wx.showModal({
            title: '提示',
            content: '未授权录音功能',
            showCancel:false
          })
        });
      } else {
        that.setData({
          selectedInputWay: this.data.selectedInputWay == 0 ? 1 : 0,
          keyboardTip: this.data.keyboardTip1
        });
      }
    },
    touchStart: function (e) {
      console.log(e)
      var startY = e.touches[0].clientY; //初始Y坐标
      this.setData({
        showRecordStatusView: true,
        startY: startY,
        keyboardTip: this.data.keyboardTip2,
        tip: this.data.tip1,
        statusIcon: this.data.voicingIcon
      });
      this.record();
    },
    touchMove: function (e) {
      var moveY = e.touches[0].clientY; //移动的Y坐标
      if (moveY - this.data.startY <= this.data.spaceDistance) {
        this.setData({
          cancelSendStatus: true,
          tip: this.data.tip2, //显示提示语改变
          statusIcon: this.data.cancelSendIcon
        });
      } else {
        this.setData({
          cancelSendStatus: false,
          tip: this.data.tip1, //显示提示语改变
          statusIcon: this.data.voicingIcon
        });
      }
    },
    touchEnd: function (e) {
      wx.stopRecord();
      this.setData({
        keyboardTip: this.data.keyboardTip1,
        showRecordStatusView: false
      });
      if (!this.data.cancelSendStatus) {
        
      } 
    },
    //录音
    record: function () {
      var that = this;
      wx.startRecord({
        success(res) {
          console.log(res);
          if (!that.data.cancelSendStatus) {
            that.triggerEvent('send', { tempFilePath: res.tempFilePath, type: 'voice'});
          }
        },
        fail: (err) =>{
          console.log(err);
          wx.showToast({
            title: '录音错误',
            duration: 500
          });
        }
      })
    },
    //发送文本
    sendText: function () {
      if (!this.data.inputContent) {
        return;
      }
      this.triggerEvent('send', { content: this.data.inputContent, type: 'text' });
      this.setData({
        inputContent: ''
      });
    }, 
    //发送图片
    sendMessage: function () {
      var that = this;
      wx.chooseImage({
        count: 9, // 默认9
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        success: res => {
          // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
          that.triggerEvent('send', { tempFilePaths: res.tempFilePaths, type: 'picture' });
        },
        fail: (err) => {
          console.log(err);
        }
      });
    }

  }
})
