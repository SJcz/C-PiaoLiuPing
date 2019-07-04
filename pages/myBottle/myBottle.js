// pages/myBottle/myBottle.js
const AV = require('../../libs/leancloud-storage.js');
const app = getApp();
const util = require('../../utils/util.js');
const { TextMessage } = require('../../libs/leancloud-realtime');
const { ImageMessage, AudioMessage } = require('../../libs/leancloud-realtime-plugin-typed-messages');

/**
 * 列表分为两种
 * 会话列表
 * 捞取的瓶子列表（还未转化为会话）
 */
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bottleList: [],
    conversationList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getItemList();
  },

  getItemList: function () {
    var that = this;

    //所有promise都resolve才进入 then, 不然进入catch, catch最早失败的promise
    Promise.all([that.getAllConversations(), that.getAllBottlesWithoutConversation()])
    .then((result) => {
      console.log(result);
      var conversations = result[0];
      Promise.all(conversations.map((conversation) => {
        //会话列表只显示最新的一条信息
        return conversation.queryMessages({
          limit: 1, // limit 取值范围 1~1000，默认 100
        }).then(function (messages) {
          console.log(messages[0]);
          //文本消息
          if (messages[0].type == TextMessage.TYPE) {
            conversation.content = messages[0].getText();
          }
          //语音消息
          if (messages[0].type == AudioMessage.TYPE) {
            conversation.content = "[语音]";
          }
          //图片消息
          if (messages[0].type == ImageMessage.TYPE) {
            conversation.content = "[图片]";
          }
        });
      })).then(() => {
        var arr = [];
        conversations.forEach((conversation) => {
          console.log(conversation)
          arr.push({
            id: conversation.id,
            content: conversation.content,
            userAvatar: conversation.get('user1Id') == app.globalData.user.id ? conversation.get('user2Avatar') : conversation.get('user1Avatar'),
            userName: conversation.get('user1Id') == app.globalData.user.id ? conversation.get('user2Name') : conversation.get('user1Name'),
            updatedAt: util.formatHM(conversation.updatedAt),
            isTouchMove: false
          });
        });
        
        that.setData({
          conversationList: arr
        });
        
      }).catch(console.error);

      var bottles = result[1];
      bottles = util.formatLeanCloudObject(bottles); //格式化AV.Object 为json
      bottles.forEach((item) => {
        item.isTouchMove = false;
        item.updatedAt = util.formatHM(new Date(item.updatedAt));
      });
      that.setData({
        bottleList: bottles
      });
    }).catch(console.error);
  },

  //获取包含当前imClient的会话列表conversations
  getAllConversations: function () {
      var conversationQuery = app.imClient.getQuery();
      conversationQuery.descending("createdAt");
      return conversationQuery.find();
  },

  //获取所有捡到的瓶子，但是不包含conversationId字段
  getAllBottlesWithoutConversation: function () {
    var query1 = new AV.Query("Bottle");
    query1.equalTo("revieverId", app.globalData.user.id); //当前用户捞到的瓶子

    var query2 = new AV.Query("Bottle");
    query2.doesNotExist("conversationId"); //还没有转变为conversation的瓶子

    var query = AV.Query.and(query1, query2);
    return query.find();
  }, 


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  switchToLiaoTianPage: function (e) {
    console.log(e);
    var bottleId = e.currentTarget.dataset.bottleid;
    var conversationId = e.currentTarget.dataset.conversationid;
    if (bottleId) {
      var bottle = this.getBottleById(bottleId);
      wx.navigateTo({
        url: '/pages/liaoTian/liaoTian?bottle=' + encodeURIComponent(JSON.stringify(bottle))
      });
    }
    if (conversationId) {
      wx.navigateTo({
        url: '/pages/liaoTian/liaoTian?conversationId=' + encodeURIComponent(conversationId)
      });
    }
  },

  getBottleById: function (id) {
    for (var i = 0; i < this.data.bottleList.length; i++) {
      if (this.data.bottleList[i].objectId == id) {
        return this.data.bottleList[i];
      }
    }
    return null;
  },

  touchstart: function (e) {
    console.log(e);
    console.log("start");
    
    //触碰的是删除按钮, 不会重置状态
    //这里使用target 而不是currentTarget， 是因为要获取事件的根源组件, 不是很懂
    if (e.target.dataset.type == 'del') {
      return;
    }
    var that = this;
    //触摸重置所有删除
    that.data.bottleList.forEach((item, i) => {
      item.isTouchMove = false;
    });
    that.data.conversationList.forEach((item, i) => {
      item.isTouchMove = false;
    });

    that.setData({
      bottleList: that.data.bottleList,
      conversationList: that.data.conversationList,
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY
    });
  },

  touchmove: function (e) {
    console.log(e)
    var that = this;
    var bottleIndex = e.currentTarget.dataset.bottleindex;
    var conversationIndex = e.currentTarget.dataset.conversationindex;

    var touchMoveX = e.changedTouches[0].clientX;//滑动变化坐标
    var touchMoveY = e.changedTouches[0].clientY;//滑动变化坐标

    var angle = that.angle({ X: that.data.startX, Y: that.data.startY }, { X: touchMoveX, Y: touchMoveY });

    //滑动角度>30度和右滑 无效
    if (angle > 30 || touchMoveX >= that.data.startX) {
      return;
    }
    that.data.bottleList.forEach((item, i) => {
      if (bottleIndex == i) {
        item.isTouchMove = true;
      } else {
        item.isTouchMove = false;
      }
    });
    that.data.conversationList.forEach((item, i) => {
      if (conversationIndex == i) {
        item.isTouchMove = true;
      } else {
        item.isTouchMove = false;
      }
    });
    /*
    console.log(that.data.bottleList);
    console.log(that.data.conversationList);
    */
    that.setData({
      bottleList: that.data.bottleList,
      conversationList: that.data.conversationList
    });
  },

  showDeleteModal: function (e) {
    console.log(e);
    var bottleId = e.currentTarget.dataset.bottleid;
    var conversationId = e.currentTarget.dataset.conversationid;
    var that = this;

    wx.showModal({
      title: '提示',
      content: '确认要删除此漂流瓶么？\n 删除之后，将再也收不到对方消息',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        //删除瓶子  退出瓶子所在会话
        if (bottleId) {
          var todo = AV.Object.createWithoutData('Bottle', bottleId);
          console.log(todo.get("conversationId"));
          if (todo.get("conversationId")) {
            app.imClient.getConversation(todo.get("conversationId")).then((conversation) => {
              console.log(conversation)
              //退出当前会话， 不再接收消息, 除非再次创建会话
              conversation.quit();
              return todo.destroy();
            }).then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 500
              });
              that.getItemList();
            }).catch(console.error);
          } else {
            todo.destroy().then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 500
              });
              that.getItemList();
            }).catch(console.error);
          }
        }
        //退出会话,  删除会话所在瓶子
        if (conversationId) {
          var query = new AV.Query("Bottle");
          query.equalTo("conversationId", conversationId);
          query.find().then((bottles) => {
            return app.imClient.getConversation(conversationId).then((conversation) => {
              //退出当前会话， 不再接收消息, 除非再次创建会话
              conversation.quit();
              return Promise.all(bottles.map((bottle) => {
                return bottle ? bottle.destroy() : '';
              }));
            });
          }).then(() => {
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 500
            });
            this.getItemList();
          }).catch(console.error);
        }
      }
    })
  },

  //计算滑动角度
  angle: function (start, end) {
    var _X = end.X - start.X;
    var _Y = end.Y - start.Y;
    //返回角度 /Math.atan()返回数字的反正切值
    return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getItemList();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})