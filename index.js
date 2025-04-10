/**
 *  echarts tooltip 自动轮播
 *  @author carsum
 *  @param chart - ECharts 实例
 *  @param chartOption - ECharts 配置项
 *  @param options - 自定义选项
 *  {
 *    interval: 轮播时间间隔，单位毫秒，默认为2000
 *    loopSeries: boolean类型，默认为true，true表示循环所有series的tooltip，false则显示指定seriesIndex的tooltip
 *    seriesIndex: 默认为0，指定某个系列（option中的series索引）循环显示tooltip，当loopSeries为true时，从seriesIndex系列开始执行
 *    updateData: 当轮播到第一个数据项时，会调用此回调函数
 *    reverseDirection: 默认为false，true表示反方向显示tooltip
 *    initialDelay: 第一个tooltip出现的延迟时间，单位毫秒，默认为2000
 *  }
 * @returns {{clearLoop: clearLoop}} - 返回一个对象，包含 clearLoop 方法用于停止轮播
 */

export function looping(chart, chartOption, options) {
  // 默认配置选项
  let defaultOptions = {
    interval: 2000,
    loopSeries: true,
    seriesIndex: 0,
    updateData: null,
    reverseDirection: false,
    initialDelay: 2000,
  }

  // 检查 chart 和 chartOption 是否有效
  if (!chart || !chartOption) {
    return {}
  }

  // 合并默认选项和用户选项
  options = Object.assign({}, defaultOptions, options)

  // 确保 seriesIndex 有效
  if (options.seriesIndex < 0 || options.seriesIndex >= chartOption.series.length) {
    options.seriesIndex = 0
  }

  // 初始化变量
  let dataIndex = 0 // 数据索引，初始化为0
  let seriesIndex = options.seriesIndex // 系列索引
  let timeTicket = 0 // 定时器
  let seriesLen = chartOption.series.length // 系列个数
  let dataLen = 0 // 某个系列数据个数
  let chartType // 系列类型
  let first = true // 是否是第一次执行

  // 高亮图表中的某个数据项
  function highlightChart(chart, seriesIndex, dataIndex) {
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex,
      dataIndex,
    })
  }

  // 取消高亮图表中的某个数据项
  function downplayChart(chart, seriesIndex, dataIndex) {
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex,
      dataIndex,
    })
  }

  // 自动显示 Tooltip
  function autoShowTip() {
    function showTip() {
      // 判断是否需要更新数据
      if (dataIndex === 0 && !first && typeof options.updateData === 'function') {
        options.updateData()
        chart.setOption(chartOption)
      }

      let series = chartOption.series
      chartType = series[seriesIndex].type // 获取系列类型
      dataLen = series[seriesIndex].data.length // 获取系列数据个数

      // 根据 reverseDirection 初始化 dataIndex
      if (options.reverseDirection && first) {
        dataIndex = dataLen - 1
      }

      // 构建 Tooltip 参数
      let tipParams = { seriesIndex }
      switch (chartType) {
        case 'map':
        case 'pie':
        case 'chord':
          tipParams.name = series[seriesIndex].data[dataIndex].name
          break
        case 'radar':
          tipParams.dataIndex = dataIndex
          break
        default:
          tipParams.dataIndex = dataIndex
          break
      }

      // 高亮和取消高亮逻辑
      if (chartType === 'pie' || chartType === 'radar') {
        let prevSeriesIndex = options.loopSeries
          ? seriesIndex === 0
            ? seriesLen - 1
            : seriesIndex - 1
          : seriesIndex

        let prevDataIndex = dataIndex === 0 ? dataLen - 1 : dataIndex - 1

        downplayChart(chart, prevSeriesIndex, prevDataIndex)
        highlightChart(chart, seriesIndex, dataIndex)
      }

      // 显示 Tooltip
      tipParams.type = 'showTip'
      chart.dispatchAction(tipParams)

      // 根据 reverseDirection 调整 dataIndex 的递增或递减逻辑
      if (options.reverseDirection) {
        dataIndex = (dataIndex - 1 + dataLen) % dataLen
      } else {
        dataIndex = (dataIndex + 1) % dataLen
      }

      // 如果循环 series 且当前系列数据已循环完，切换到下一个系列
      if (options.loopSeries && dataIndex === 0 && !first) {
        seriesIndex = (seriesIndex + 1) % seriesLen
      }

      first = false
    }

    showTip()
    timeTicket = setInterval(showTip, options.interval)
  }

  // 关闭轮播
  function stopAutoShow() {
    if (timeTicket) {
      clearInterval(timeTicket)
      timeTicket = 0

      if (chartType === 'pie' || chartType === 'radar') {
        let prevSeriesIndex = options.loopSeries
          ? seriesIndex === 0
            ? seriesLen - 1
            : seriesIndex - 1
          : seriesIndex

        let prevDataIndex = dataIndex === 0 ? dataLen - 1 : dataIndex - 1

        downplayChart(chart, prevSeriesIndex, prevDataIndex)
      }
    }
  }

  // 获取 ZRender 实例
  let zRender = chart.getZr()

  // 鼠标移动事件处理函数
  function zRenderMouseMove(param) {
    if (param.event) {
      param.event.cancelBubble = true // 阻止 canvas 上的鼠标移动事件冒泡
    }
    stopAutoShow()
  }

  // 离开 ECharts 图表时恢复自动轮播
  function zRenderGlobalOut() {
    if (!timeTicket) {
      autoShowTip()
    }
  }

  // 绑定事件
  chart.on('mousemove', stopAutoShow)
  zRender.on('mousemove', zRenderMouseMove)
  zRender.on('globalout', zRenderGlobalOut)

  // 使用 setTimeout 实现初始延迟
  setTimeout(autoShowTip, options.initialDelay)

  // 返回 clearLoop 方法用于停止轮播
  return {
    clearLoop: function () {
      if (timeTicket) {
        clearInterval(timeTicket)
        timeTicket = 0
      }

      // 解绑事件
      chart.off('mousemove', stopAutoShow)
      zRender.off('mousemove', zRenderMouseMove)
      zRender.off('globalout', zRenderGlobalOut)
    },
  }
}
