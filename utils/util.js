const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const uuid = () => {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join('');
}

module.exports = {
  formatTime: formatTime,
  uuid: uuid,
  formatHM: function (date) {
    var hour = date.getHours();       // 获取当前小时数(0-23)
    var min = date.getMinutes();     // 获取当前分钟数(0-59)

    hour = hour < 10 ? '0' + hour : hour;
    min = min < 10 ? '0' + min : min;
    return hour + ":" + min;
  },
  formatHMS: function (date) {
    var hour = date.getHours();       // 获取当前小时数(0-23)
    var min = date.getMinutes();     // 获取当前分钟数(0-59)
    var sec = date.getSeconds();

    hour = hour < 10 ? '0' + hour : hour;
    min = min < 10 ? '0' + min : min;
    sec = sec < 10 ? '0' + sec : sec;
    return hour + ":" + min + ":" + sec;
  },
  //因为直接用arr.forEach替换item无效, 别问我为什么, 我TM也不知道啊， 草
  formatLeanCloudObject: function (arr) {
    var returnArr = [];
    arr.forEach((item) => {
      returnArr.push(item.toJSON());
    });
    return returnArr;
  },
  getConversation: function (id, arr) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id == id) {
        return arr[i];
      }
    }
    return null;
  }
}