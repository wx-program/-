//setting.js
var util = require("../../utils/util.js");
//更改数组 第三个参数是对象
function editArr(arr, i, editCnt) {
  let newArr = arr, editingObj = newArr[i];
  newArr.map(function (a) {
    if (a.id == i) {
      for (var x in editCnt) {
        a[x] = editCnt[x];
      }
    }
  })
  return newArr;
}

//获取应用实例
var app = getApp()
Page({
  data: {
    userInfo: {},
    showAll: true,
    lists: [],
    newLi: { id: '', content: '', begin: util.formatTime2(), needRemind: true, editing: false, done: false }, src:'http://ws.stream.qqmusic.qq.com/C100001Bbv083BhcyW.m4a?fromtag=46'
  },
  onReady: function (e) {
    this.audioCtx = wx.createAudioContext('myAudio');
    this.remind();
  },
  //事件处理函数,查看启动日志
  bindViewTap: function () {
    wx.navigateTo({
      url: '../../logs/logs'
    })
  },
  //跳转页面
  gosetting: function () {
    wx.navigateTo({
      url: '../setting/setting'
    })
  },
  goschedule: function () {
    wx.navigateTo({
      url: '../scheduling/scheduling'
    })
  },
  goplan: function () {
    wx.navigateTo({
      url: '../beforeplan/beforeplan'
    })
  },
  onLoad: function () {
    var that = this;
    //获取之前保留在缓存里的数据
    wx.getStorage({
      key: 'todolist',
      success: function (res) {
        if (res.data) {
          that.setData({
            lists: res.data
          })
        }
      }
    })
    //获取用户信息
    app.getUserInfo(function (userInfo) {
      that.setData({
        userInfo: userInfo
      })
    })
  },
  //待做事项编辑框绑定事件
  iptChange(e) {
    this.setData({
      'newLi.content': e.detail.value,
      'newLi.begin': util.formatTime2()
    })
  },
  //表单重置
  formReset() {
    this.setData({
      'newLi.content': ''
    })
  },
  //表单提交
  formSubmit() {
    let newLists = this.data.lists, i = 0, newTodo = this.data.newLi;
    if (newLists.length > 0) {
      i = Number(util.sortBy(newLists, 'id', true)[0].id) + 1;
    }
    newTodo.id = i;
    if (newTodo.content != '') {
      newLists.push(newTodo);
      this.setData({
        lists: newLists,
        newLi: { id: '', content: '', begin: util.formatTime2(), needRemind: true, editing: false, done: false }
      })
    }
    this.remind();
  },
  //提醒时间赋值
  beginTime(e) {
    this.setData({
      'newLi.begin': e.detail.value
    })
  },
  switch1Change(e) {
    this.setData({
      'newLi.needRemind': e.detail.value
    })
  },
  //修改备忘录
  toChange(e) {
    let i = e.target.dataset.id;
    this.setData({
      lists: editArr(this.data.lists, i, { editing: true })
    })
  },
  iptEdit(e) {
    let i = e.target.dataset.id;
    this.setData({
      lists: editArr(this.data.lists, i, { curVal: e.detail.value })
    })
  },
  //保存编辑
  saveEdit(e) {
    let i = e.target.dataset.id;
    this.setData({
      lists: editArr(this.data.lists, i, { content: this.data.lists[i].curVal, editing: false })
    })
  },
  //设置事件已经完成
  setDone(e) {
    let i = e.target.dataset.id, newLists = this.data.lists;
    newLists.map(function (l, index) {
      if (l.id == i) {
        newLists[index].done = !l.done;
        newLists[index].needRemind = false;
      }
    })
    this.setData({
      lists: newLists
    })
  },
  //删除事件
  toDelete(e) {
    let i = e.target.dataset.id, newLists = this.data.lists;
    newLists.map(function (l, index) {
      if (l.id == i) {
        newLists.splice(index, 1);
      }
    })
    this.setData({
      lists: newLists
    })
  },
  //全部完成
  doneAll() {
    let newLists = this.data.lists;
    newLists.map(function (l) {
      l.done = true;
    })
    this.setData({
      lists: newLists
    })
  },
  //全删
  deleteAll() {
    this.setData({
      lists: []
    })
  },
  //显示未完成
  showUnfinished() {
    this.setData({
      showAll: false
    })
  },
//显示全部事项
  showAll() {
    this.setData({
      showAll: true
    })
  },
  //保存全部事项
  saveData() {
    let listsArr = this.data.lists;
    wx.setStorage({
      key: 'todolist',
      data: listsArr
    })
  },
  //铃声提醒
  audioPlay: function () {
    this.audioCtx.play()
  },
  audioPause: function () {
    this.audioCtx.pause()
  },

  audioStart: function () {
    this.audioCtx.seek(0)
  },
  //获得需提醒事件时间表
  getRemindArr() {
    let thisLists = this.data.lists, closeT = 0, notDoneLists = [];
    let date = new Date(), now = [date.getHours(), date.getMinutes()];
    thisLists.map(function (l) {
      if (l.needRemind) {
        notDoneLists.push(l)
      }
    })
    if (notDoneLists.length > 0) {
      let newLists = util.sortBy(notDoneLists, 'begin'), firstT = (newLists[0].begin).split(':'), id = newLists[0].id, cnt = newLists[0].content;
      closeT = ((firstT[0] - now[0]) * 60 + (firstT[1] - now[1]) - 1) * 60;
      closeT = closeT >= 0 ? closeT : 0;
      return { closeT, id, cnt };
    } else {
      return false;
    }
  },
  //通知栏提醒
  remind() {
    let result = this.getRemindArr(), t = result.closeT, id = result.id, that = this, cnt = result.cnt;
    function alarm() {
      that.audioPlay();
      let newLists = that.data.lists;
      wx.showModal({
        title: '马上去做吧',
        content: cnt,
        success: function (res) {
          if (res.confirm) {
            that.audioPause();
            that.audioStart();
            newLists.map(function (l, index) {
              if (l.id == id) {
                newLists[index].done = true;
                newLists[index].needRemind = false;
              }
            })
            that.setData({
              lists: newLists
            })
          } else {
            that.audioPause();
            that.audioStart();
            newLists.map(function (l, index) {
              if (l.id == id) {
                newLists[index].needRemind = false;
              }
            })
            that.setData({
              lists: newLists
            })
          }
        }
      })
    }
    if (result) {
      setTimeout(alarm, Math.floor(t * 1000), function () {
        that.remind();
      })
    }
  }
})