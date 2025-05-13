/**
 * echarts tooltip 自动轮播
 * @author carsum
 * @param chart - ECharts 实例
 * @param chartOption - ECharts 配置项
 * @param options - 自定义选项
 * {
 *   interval: 轮播时间间隔，单位毫秒，默认为2000
 *   loopSeries: boolean类型，默认为true，true表示循环所有series的tooltip，false则显示指定seriesIndex的tooltip
 *   seriesIndex: 默认为0，指定某个系列（option中的series索引）循环显示tooltip，当loopSeries为true时从seriesIndex开始执行
 *   updateData: 可选回调，在轮播到第一个数据时调用该函数用于更新数据
 *   reverseDirection: 默认为false，true表示反方向显示tooltip
 *   initialDelay: 第一个tooltip出现的延迟时间，单位毫秒，默认为2000
 * }
 * @returns {{clearLoop: clearLoop}} - 返回一个对象，包含 clearLoop 方法用于停止轮播
 */

export function looping(chart, chartOption, options) {
  // 默认配置
  let defaultOptions = {
    interval: 2000,
    loopSeries: true,
    seriesIndex: 0,
    updateData: null,
    reverseDirection: false,
    initialDelay: 2000,
  }

  if (!chart || !chartOption) {
    return {}
  }

  // 合并默认和用户选项
  options = Object.assign({}, defaultOptions, options)

  // 确保 seriesIndex 有效
  if (options.seriesIndex < 0 || options.seriesIndex >= chartOption.series.length) {
    options.seriesIndex = 0
  }

  let dataIndex = 0
  let seriesIndex = options.seriesIndex
  let timeTicket = null
  let seriesLen = chartOption.series.length
  let dataLen = chartOption.series[seriesIndex].data.length
  let chartType = chartOption.series[seriesIndex].type
  let first = true
  let lastDataIndex = null

  function highlightChart(chart, seriesIndex, dataIndex) {
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex,
      dataIndex,
    })
  }

  function downplayChart(chart, seriesIndex, dataIndex) {
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex,
      dataIndex,
    })
  }

  function stopAutoShow() {
    if (timeTicket) {
      clearInterval(timeTicket)
      timeTicket = null
    }
  }

  function autoShowTip() {
    // 先清理旧的定时器
    stopAutoShow()

    // 初始化一次当前图表数据长度
    const series = chartOption.series[seriesIndex]
    chartType = series.type
    dataLen = series.data.length

    // 设置初始位置
    if (options.reverseDirection && first) {
      dataIndex = dataLen - 1
    } else {
      dataIndex = 0
    }

    // 显示 Tooltip
    function showTip() {
      // 防止重复触发同一个 dataIndex
      if (dataIndex === lastDataIndex) {
        return
      }

      // 构建参数
      let tipParams = { seriesIndex }

      switch (chartType) {
        case 'map':
        case 'pie':
        case 'chord':
          if (series.data[dataIndex] && series.data[dataIndex].name !== undefined) {
            tipParams.name = series.data[dataIndex].name
          } else {
            tipParams.dataIndex = dataIndex
          }
          break
        case 'radar':
          tipParams.dataIndex = dataIndex
          break
        default:
          tipParams.dataIndex = dataIndex
          break
      }

      tipParams.type = 'showTip'
      chart.dispatchAction(tipParams)

      // 更新高亮状态
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

      // 更新 dataIndex
      if (options.reverseDirection) {
        dataIndex = (dataIndex - 1 + dataLen) % dataLen
      } else {
        dataIndex = (dataIndex + 1) % dataLen
      }

      // 如果循环 series 且当前系列已经循环一圈，切换下一个系列
      if (options.loopSeries && dataIndex === 0 && !first) {
        seriesIndex = (seriesIndex + 1) % seriesLen
      }

      lastDataIndex = dataIndex
      first = false
    }

    showTip()
    timeTicket = setInterval(showTip, options.interval)
  }

  // 获取 ZRender 实例
  const zRender = chart.getZr()

  let debounceTimer = null

  function onMouseMove(param) {
    if (param.event) {
      param.event.cancelBubble = true
    }

    stopAutoShow()

    // 防抖恢复
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(autoShowTip, options.interval / 2)
  }

  function onGlobalOut() {
    if (!timeTicket) {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(autoShowTip, options.initialDelay)
    }
  }

  // 绑定事件监听
  chart.on('mousemove', stopAutoShow)
  zRender.on('mousemove', onMouseMove)
  zRender.on('globalout', onGlobalOut)

  // 初始启动
  setTimeout(autoShowTip, options.initialDelay)

  // 返回清除方法
  return {
    clearLoop: () => {
      if (timeTicket) {
        clearInterval(timeTicket)
        timeTicket = null
      }

      // 解绑事件
      chart.off('mousemove', stopAutoShow)
      zRender.off('mousemove', onMouseMove)
      zRender.off('globalout', onGlobalOut)
    }
  }
}
