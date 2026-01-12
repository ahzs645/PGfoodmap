export interface WinwheelOptions {
  canvasId: string
  numSegments: number
  outerRadius: number
  innerRadius: number
  pointerAngle: number
  textFontFamily: string
  textFontSize: number
  textFontWeight: string
  textOrientation: string
  textAlignment: string
  textDirection: string
  textMargin: number
  textFillStyle: string
  strokeStyle: string
  lineWidth: number
  segments: Array<{ text: string; fillStyle: string }>
  animation: {
    type: string
    duration: number
    spins: number
    easing: string
    stopAngle?: number
    callbackFinished: (segment: unknown) => void
  }
}

export interface WinwheelInstance {
  animation: {
    stopAngle: number
  }
  getRandomForSegment(segmentNumber: number): number
  startAnimation(): void
  stopAnimation(): void
  draw(): void
}

export class Winwheel implements WinwheelInstance {
  constructor(options: WinwheelOptions)
  animation: { stopAngle: number }
  getRandomForSegment(segmentNumber: number): number
  startAnimation(): void
  stopAnimation(): void
  draw(): void
}

export default Winwheel
