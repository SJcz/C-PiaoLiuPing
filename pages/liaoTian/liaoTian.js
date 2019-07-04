// pages/liaoTian/liaoTian.js
const app = getApp();
const util = require('../../utils/util');
const AV = require('../../libs/leancloud-storage');
const { TextMessage } = require('../../libs/leancloud-realtime');
const { ImageMessage, AudioMessage} = require('../../libs/leancloud-realtime-plugin-typed-messages');

Page({
  conversation: null, //会话对象
  conversationId: null, //会话ID
  bottle: null, //瓶子对象, 非AV.Object, 而是json对象
  /**
   * 页面的初始数据
   */
  data: {
    swiperHeight: 0, //聊天组件界面高度, 通过页面高度减去输入组件的高度得到
    //{ type: 'text', content: '抬头是天上月, 低头时心上人, 低头时心上人', avatar: '', role: 'self' }
    chatList: [], //聊天组件 聊天列表

  },

  //如果当前会话对象不存在,根据conversationId重新获取会话对象
  //如果不存在conversationId， 根据传递过来的bottle对象创建新会话
  getConversation: function () {
    var that = this;
    if (this.conversationId) {
      return app.imClient.getConversation(this.conversationId).then((conversation) => {
        that.conversation = conversation;
      });
    } else if (this.bottle) {
      return app.imClient.createConversation({
        members: [that.bottle.senderId], //bottle的发送者
        name: '',
        unique: false, //不然捡到相同用户的瓶子，会合并回一个会话.
        //为该对话设置聊天双方的基本信息
        //使用 conversation.get('attr.user1Id') 这种方式获取自定义属性值
        user1Id: that.bottle.senderId,
        user1Name: that.bottle.senderName,
        user1Avatar: that.bottle.senderAvatar,
        user2Id: app.globalData.user.id,
        user2Name: app.globalData.user.nickName,
        user2Avatar: app.globalData.user.avatarUrl
      }).then((conversation) => {
        console.log(conversation);
        that.conversation = conversation;
        //更新瓶子的conversation字段信息， 绑定会话到瓶子上
        var bottle = AV.Object.createWithoutData('Bottle', that.bottle.objectId);
        bottle.set("conversationId", conversation.id);
        return bottle.save();
      });
    } else {
      wx.showToast({
        title: '当前会话不存在',
      })
    }
  }, 

  sendMessage: function (e) {
    var obj = e.detail;
    var that = this;
    var avatarUrl = app.globalData.user.avatarUrl;
    if (obj.type == "text") {
      that.data.chatList.push({
        type: 'text',
        content: obj.content,
        path: '',
        avatar: avatarUrl,
        role: 'self'
      });
      this.conversation.send(new TextMessage(obj.content)).then(function (message) {
        console.log(message);
        console.log(message.text);
        console.log(message.getText());
        console.log('Tom & Jerry', '发送成功！');
      }).catch(console.error);
    } else if (obj.type == "voice") {
      that.data.chatList.push({
        type: 'voice',
        content: '',
        path: obj.tempFilePath,
        avatar: avatarUrl,
        role: 'self'
      });

      var file = new AV.File('liaotian.mp3', { blob: { uri: obj.tempFilePath } });
      file.save().then(() => {
        var message = new AudioMessage(file);
        message.setText('发自我的Iphone');
        that.conversation.send(message).then(function (message) {
          console.log(message);
          console.log('voice message发送成功！');
        }).catch(console.error);
      }).catch(console.error);
    } else if (obj.type == "picture") {
      obj.tempFilePaths.forEach((path) => {
        that.data.chatList.push({
          type: 'picture',
          content: '',
          path: path,
          avatar: avatarUrl,
          role: 'self'
        });
      });

      obj.tempFilePaths.forEach((path) => {
        var file = new AV.File('liaotian.jpg', { blob: { uri: path } });
        file.save().then(() => {
          var message = new ImageMessage(file);
          message.setText('发自我的Iphone');
          that.conversation.send(message).then(function (message) {
            console.log(message);
            console.log('picture message发送成功！');
          }).catch(console.error);
        }).catch(console.error);
      });

    }
    //为最新的聊天记录 设置scrollId, 为了scrollView 发送新消息时自动滑动
    that.data.chatList[that.data.chatList.length - 1].scrollId = "chat-" + util.uuid(); 
    that.setData({
      chatList: that.data.chatList
    });
  },

  send: function (e) {
    var that = this;
    if (!this.conversation) {
      this.getConversation().then(() => {
        that.sendMessage(e);
      }).catch(console.error);
      return;
    }
    this.sendMessage(e);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    var that = this;

    if (options.conversationId) {
      this.conversationId = decodeURIComponent(options.conversationId);
      //获取会话, 查询最新10条记录
      app.imClient.getConversation(this.conversationId).then((conversation) => {
        console.log(conversation)
        that.conversation = conversation;
        conversation.queryMessages({
          limit: 10, // limit 取值范围 1~1000，默认 100
        }).then((messages) => {
          console.log(messages);
          messages.forEach((message) => {
            console.log(message.from);
            var chat = that.getChatItem(message, conversation);
            that.data.chatList.push(chat);
            that.data.chatList[that.data.chatList.length - 1].scrollId = "chat-" + util.uuid(); 
            that.setData({
              chatList: that.data.chatList
            });
          });
        }).catch(console.error);
      });
    }
    if (options.bottle) {
      this.bottle = JSON.parse(decodeURIComponent(options.bottle));
      console.log(this.bottle);

      that.setData({
        chatList: [{
          type: 'text',
          content: that.bottle.content,
          path: '',
          avatar: that.bottle.senderAvatar,
          role: 'other'
        }]
      });
    }
    
    this.setScrollHeight();
  },

  setScrollHeight: function () {
    //获取输入组件对象, 以便于获取其高度信息, 因为直接使用class查询,
    //是无法查询到自定义组件的节点的
    var that = this;
    var sessionWidget = this.selectComponent("#sessionWidget");
    var query = sessionWidget.createSelectorQuery();
    query.select('.session-view').boundingClientRect((rect) => {
      console.log(rect);
      var topHeight = rect.height;
      var pageHeight = wx.getSystemInfoSync().windowHeight;
      console.log(pageHeight - topHeight);
      that.setData({
        swiperHeight: pageHeight - topHeight
      });
    }).exec();    
  },

  //根据message 类型和会话信息 创建一个chat item
  getChatItem: function (message, conversation) {
    var chat = {};
    //文本消息
    if (message.type == TextMessage.TYPE) {
      chat.type = "text";
      chat.content = message.getText();
      chat.path = '';
    }
    //语音消息
    if (message.type == AudioMessage.TYPE) {
      chat.type = "voice";
      chat.content = '';
      chat.path = message.getFile().url();
    }
    //图片消息
    if (message.type == ImageMessage.TYPE) {
      chat.type = "picture";
      chat.content = '';
      chat.path = message.getFile().url();
    }
    //如果消息的发送者是本人,显示当前用户的头像
    if (message.from == app.globalData.user.id) {
      chat.avatar = app.globalData.user.avatarUrl;
      chat.role = 'self';
    } else {
      if (message.from == conversation.get('user1Id')) {
        chat.avatar = conversation.get('user1Avatar');
      } else {
        chat.avatar = conversation.get('user2Avatar');
      }
      chat.role = 'other';
    }

    return chat;
  },

  //当有新消息到达时会触发这个函数
  refreshChatList: function (message, conversation) {
    //会话ID一致，说明是当前会话
    var that = this;
    if (this.conversation && this.conversation.id == conversation.id) {
      var chat = this.getChatItem(message, conversation);
      this.data.chatList.push(chat);

      //为最新的聊天记录 设置scrollId, 为了scrollView 获取新消息时自动滑动
      this.data.chatList[this.data.chatList.length - 1].scrollId = "chat-" + util.uuid(); 
      this.setData({
        chatList: this.data.chatList
      });
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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