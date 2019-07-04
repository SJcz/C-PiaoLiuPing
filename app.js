//app.js
const util = require('./utils/util.js');
const AV = require('./libs/leancloud-storage.js');
const Realtime = require('./libs/leancloud-realtime.js').Realtime;
const TypedMessagesPlugin = require('./libs/leancloud-realtime-plugin-typed-messages.js').TypedMessagesPlugin;
const ImageMessage = require('./libs/leancloud-realtime-plugin-typed-messages.js').ImageMessage;
const Event = require('./libs/leancloud-realtime.js').Event;
// 初始化存储 SDK
AV.init({
  appId: 'xxxxxxxxxxxxxx-gzGzoHsz',
  appKey: 'xxxxxxxxxxxxxxx',
  serverURLs: 'https://avoscloud.com'
});
// 初始化即时通讯 SDK
const realtime = new Realtime({
  appId: 'xxxxxxxxxxxxxxxx-gzGzoHsz',
  appKey: 'xxxxxxxxxxxxxxxxxxxx',
  plugins: [TypedMessagesPlugin], // 注册富媒体消息插件
});
AV.Bottle = AV.Object.extend('Bottle');

App({
  realtime: realtime,  //即时通讯 对象
  imClient: null, // IMClient 对象
  globalData: {
  },

  ininClient: function () {
    var that = this;
    that.realtime.createIMClient(that.globalData.user.id).then(function (client) {
      console.log(client);
      // 当前用户收到了某一条消息，可以通过响应 Event.MESSAGE 这一事件来处理。
      client.on(Event.MESSAGE, function (message, conversation) {
        console.log(conversation)
        console.log(message);
        console.log('收到新消息：' + message.getText());

        var pages = getCurrentPages();
        pages.forEach((page) => {
          //如果当前聊天页面存在, 刷新聊天页面的chatlist
          console.log(page.__route__);
          if (page.__route__ == "pages/liaoTian/liaoTian") {
            page.refreshChatList(message, conversation);
          }
        })
      });
      that.imClient = client;
    }).catch(console.error);
  },

  onLaunch: function () {
    //var user = AV.User.current();
    //console.log("user", user);
    var that = this;
    var user = wx.getStorageSync("user");

    if (user) {
      console.log(user);
      that.globalData.user = user;
      that.ininClient();
      return;
    }

    /*
    if (user) {
      this.getUserInfo().then((userInfo) => {
        //更新用户信息
        user.set(userInfo).save().then(user => {
          // 成功，此时可在控制台中看到更新后的用户信息
          console.log(user);
          that.globalData.user = user;
          if (that.userInfoReadyCallback) {
            that.userInfoReadyCallback();
          }

          // 用自己的名字作为 clientId 来登录即时通讯服务
          that.realtime.createIMClient(userInfo.nickName).then(function (client) {
            // 成功登录
            console.log(client);
            
            // 当前用户收到了某一条消息，可以通过响应 Event.MESSAGE 这一事件来处理。
            client.on(Event.MESSAGE, function (message, conversation) {
              
              console.log(message);
              console.log('收到新消息：' + message.text);
            });
            that.imcClient = client;
          }).catch(console.error);
        }).catch(console.error);
      });
    }
    */
  },
})