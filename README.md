# echarts-tooltip-loop
![image](./demo.gif)

## Install

```node
npm install echarts-tooltip-loop --save
```

## Usage

```html
<div class="charts" ref="charts"></div>
```

```js

// demo 
import * as echarts from 'echarts'
import { looping } from '@/utils/echarts-tooltip-loop.js'

// your code if vue3
let charts = ref()
let myChart = echarts.init(charts.value)
const option = {}
myChart.setOption(option)

//use tooltipLoop
looping(myChart, option)

//or need clearLoop
const loopController = looping(myChart, option)
loopController.clearLoop();

```

## credits
[echarts-tooltip-loop](https://github.com/carsum/echarts-tooltip-loop)










