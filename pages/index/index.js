// pages/piaoliuping/piaoliuping.js
const AV = require('../../libs/leancloud-storage.js');
const app = getApp();
const util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    throwOneIcon: 'http://120.78.124.36/wxxcx/C_PLP/rengyige.png',
    fishOneIcon: 'http://120.78.124.36/wxxcx/C_PLP/naoyige.png',
    myBottleIcon: 'http://120.78.124.36/wxxcx/C_PLP/wodepingzi.png',
    bottlePicture: 'http://120.78.124.36/wxxcx/C_PLP/pingzi.png', //瓶子动画的瓶子
    yuwangPicture: 'http://120.78.124.36/wxxcx/C_PLP/yuwang.png', //渔网
    backgroundImage: 'http://120.78.124.36/wxxcx/C_PLP/index-background.png', //页面背景图
    fishBottleResultUrl: '', //捞瓶子动画结束后的结果显示, 只能是fishBottleResultBottleUrl/fishBottleResultHaiXingUrl
    fishBottleResultBottleUrl: 'http://120.78.124.36/wxxcx/C_PLP/piaoliuping.png',
    fishBottleResultHaiXingUrl: 'http://120.78.124.36/wxxcx/C_PLP/haixing.png',
    isHideThrowBottleModal: true, //扔瓶子(输入文字)modal
    isHideBottleAnimationView: true, //扔瓶子动画所在的view
    isHideYWAnimationView: true, //捡瓶子动画的渔网view
    inputContent: '',
    isHideResultView: true, //捞瓶子动画结束后的结果view(海星或者瓶子)是否显示
    isInAnimation: false, //正在动画状态(扔瓶子, 捡瓶子)
    bottleAnimationTime: 2000, //扔瓶子动画持续时间,
    ownUserInfo: false, //如果用户未登录 显示授权用户信息按钮
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    console.log("index...........");
    app.userInfoReadyCallback = () => {
      that.setData({
        ownUserInfo: true
      });
    }
    if (app.globalData.user) {
      that.setData({
        ownUserInfo: true
      });
    }
  },

  //获取用户信息按钮
  getUserInfo: function(e) {
    //不用leancloud的用户系统
    var that = this;
    var userInfo = e.detail.userInfo;
    console.log(userInfo);
    if (userInfo) {
      app.globalData.user = userInfo;
      app.globalData.user.id = util.uuid();
      wx.setStorageSync('user', app.globalData.user);
      that.setData({
        ownUserInfo: true
      });

      app.ininClient();
    }
    /*
    //使用leancloud 一键登录
    var that = this;
    var userInfo = e.detail.userInfo;

    if (userInfo) {
      AV.User.loginWithWeapp().then(user => {
        user.set(userInfo).save().then(user => {
          // 成功，此时可在控制台中看到更新后的用户信息
          console.log(user);
          app.globalData.user = user;
          that.setData({
            ownUserInfo: true
          });
        }).catch(console.error);
      }).catch(console.error);
    }
    */

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  //点击扔瓶子图标
  showThrowBottleModal: function() {
    var that = this;

    if (that.data.isInAnimation) {
      return;
    }
    if (!app.globalData.user) {
      wx.showToast({
        title: '请先登录',
        duration: 500
      });
      return;
    }
    this.setData({
      isHideThrowBottleModal: false, //显示modal
      isHideBottleAnimationView: false //显示瓶子动画所在的view， 不然直接执行动画会有bug
    }, () => {
      var animation = wx.createAnimation({
        duration: 0,
        timingFunction: 'ease',
      })

      //这里是相对于改view最初的动画设置
      animation.translate(0, 0).scale(1, 1).rotate(0).step();

      that.setData({
        bottleAnimation: animation.export()
      });
    });
  },

  //扔瓶子-输入框值改变事件
  inputTextarea: function(e) {
    var that = this;
    that.setData({
      inputContent: e.detail.value
    });
  },

  //取消扔出
  cancel: function() {
    this.setData({
      isHideThrowBottleModal: true,
      isHideBottleAnimationView: true
    })
  },

  //确认扔出
  confirm: function() {
    var that = this;
    console.log(that.data.inputContent);

    if (that.data.inputContent.length < 3) {
      wx.showToast({
        title: '至少输入3个字符',
        icon: 'warn',
        duration: 500
      });
      return;
    }

    that.setData({
      isHideThrowBottleModal: true
    }, () => {
      var animation = wx.createAnimation({
        duration: that.data.bottleAnimationTime,
        timingFunction: 'ease',
      })

      //y轴下移100px, 缩小到0倍, 旋转720度
      animation.translate(0, 100).scale(0, 0).rotate(720).step();

      that.setData({
        bottleAnimation: animation.export(),
        isInAnimation: true
      });

      that.sendThrowBottleRequest(that.data.inputContent);

      //扔瓶子动画2s后， 设置isInAnimation
      setTimeout(() => {
        that.setData({
          isInAnimation: false,
        });
      }, that.data.bottleAnimationTime);
    });
  },

  //发送扔瓶子请求
  sendThrowBottleRequest: function(content) {
    var bottle = new AV.Bottle();
    bottle.set("senderId", app.globalData.user.id); //user对象
    bottle.set("senderName", app.globalData.user.nickName);
    bottle.set("senderAvatar", app.globalData.user.avatarUrl);
    bottle.set("clientId", app.imClient.id); //当前client的ID， 其实就是用户id, 为后续聊天准备
    bottle.set("content", content);
    bottle.save().then((result) => {
      console.log('success');
      console.log(result);
    }).catch((err) => {
      console.log(err);
    })
  },

  //显示捞瓶子动画view
  showYuWangAnimationView: function() {
    var that = this;

    if (that.data.isInAnimation) {
      return; //如果正有动画运行, 那么不进行任何操作, 否则动画会重新进行
    }
    that.setData({
      isHideYWAnimationView: false
    }, () => {
      var animation = wx.createAnimation({
        duration: 500,
        timingFunction: 'linear',
      })

      animation.translate(-50, 0).step();
      animation.translate(0, 0).step();
      animation.translate(50, 0).step();
      animation.translate(0, 0).step();
      animation.translate(-50, 0).step();
      animation.translate(0, 0).step();

      that.setData({
        yuwangAnimation: animation.export(),
        isInAnimation: true,
      });

      that.getFishBottleResult(); //获取捞瓶子结果

      //捞瓶子动画结束后， 隐藏捞瓶子动画view,显示捞取结果
      setTimeout(() => {
        that.setData({
          isHideYWAnimationView: true,
          isHideResultView: false,
        });

        //捞取结果显示2s后， 结束捞取状态，隐藏所有view
        setTimeout(() => {
          that.setData({
            isInAnimation: false,
            isHideResultView: true,
          });
        }, 2000);
      }, 3000);
    });
  },

  //获取捞瓶子结果，整个请求过程需要在3s完成, 不然会出现不可预知异常.
  getFishBottleResult: function() {
    var that = this;

    if (parseInt((Math.random() * 10)) > 5) {
      that.setData({
        fishBottleResultUrl: that.data.fishBottleResultHaiXingUrl,
      });
      return;
    }

    var query1 = new AV.Query("Bottle");
    query1.notEqualTo("senderId", app.globalData.user.id); //查询不是本人扔出的瓶子

    var query2 = new AV.Query("Bottle");
    query2.doesNotExist("revieverId"); //查询没有被捞到的瓶子

    var query = new AV.Query.and(query1, query2);
    query.descending('createdAt'); //根据扔出时间排序

    query.find().then((result) => {
      console.log(result);
      if (result.length == 0) {
        that.setData({
          fishBottleResultUrl: that.data.fishBottleResultHaiXingUrl,
        });
        return;
      }

      //更新瓶子的接收者信息
      var bottle = AV.Object.createWithoutData('Bottle', result[0].id);
      bottle.set("revieverId", app.globalData.user.id);
      bottle.set("revieverName", app.globalData.user.nickName);
      bottle.set("revieverAvatar", app.globalData.user.avatarUrl);
      bottle.save().then(() => {
        that.setData({
          fishBottleResultUrl: that.data.fishBottleResultBottleUrl,
        });
      }).catch((err) => {
        console.log(err);
        that.setData({
          fishBottleResultUrl: that.data.fishBottleResultHaiXingUrl,
        });
      });
    }).catch((err) => {
      console.log(err);
      that.setData({
        fishBottleResultUrl: that.data.fishBottleResultHaiXingUrl,
      });
    });
  },

  //打开捞到的瓶子
  openBottle: function() {
    var that = this;
    if (that.data.fishBottleResultUrl == that.data.fishBottleResultBottleUrl) {
      wx.navigateTo({
        url: '/pages/myBottle/myBottle',
      });
    }
  },

  /*切换到我的瓶子页面 */
  switchToMyBottlePage: function() {
    wx.navigateTo({
      url: '/pages/myBottle/myBottle',
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})