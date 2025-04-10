// index.d.ts

declare module 'echarts-tooltip-loop' {
  interface Options {
    interval?: number;
    loopSeries?: boolean;
    seriesIndex?: number;
    updateData?: () => void;
    reverseDirection?: boolean;
    initialDelay?: number;
  }

  interface LoopResult {
    clearLoop: () => void;
  }

  function looping(chart: any, chartOption: any, options?: Options): LoopResult;

  export = looping;
}