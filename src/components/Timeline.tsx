import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

interface TimelineProps {
  startDate: Date
  endDate: Date
  currentDate: Date
  onDateChange: (date: Date) => void
}

const speedOptions = [
  { value: 2000, label: '0.5x' },
  { value: 1000, label: '1x' },
  { value: 500, label: '2x' },
  { value: 250, label: '4x' }
]

function snapToMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function Timeline({ startDate, endDate, currentDate, onDateChange }: TimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1000)
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const progress = useMemo(() => {
    const total = endDate.getTime() - startDate.getTime()
    const current = currentDate.getTime() - startDate.getTime()
    return Math.max(0, Math.min(100, (current / total) * 100))
  }, [startDate, endDate, currentDate])

  const formattedDate = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }, [currentDate])

  const formattedStartDate = useMemo(() => {
    return startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }, [startDate])

  const formattedEndDate = useMemo(() => {
    return endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }, [endDate])

  const yearMarkers = useMemo(() => {
    const markers: { year: number; position: number }[] = []
    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()
    const totalTime = endDate.getTime() - startDate.getTime()

    for (let year = startYear; year <= endYear; year++) {
      const yearStart = new Date(year, 0, 1)
      if (yearStart >= startDate && yearStart <= endDate) {
        const position = ((yearStart.getTime() - startDate.getTime()) / totalTime) * 100
        markers.push({ year, position })
      }
    }
    return markers
  }, [startDate, endDate])

  const stepForward = useCallback(() => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    newDate.setDate(1)
    if (newDate <= endDate) {
      onDateChange(newDate)
    } else {
      setIsPlaying(false)
    }
  }, [currentDate, endDate, onDateChange])

  const stepBackward = useCallback(() => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    newDate.setDate(1)
    if (newDate >= startDate) {
      onDateChange(newDate)
    }
  }, [currentDate, startDate, onDateChange])

  // Skip to start/end functions available if needed in the future
  // const skipToStart = () => onDateChange(snapToMonth(new Date(startDate)))
  // const skipToEnd = () => onDateChange(snapToMonth(new Date(endDate)))

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const progressValue = parseFloat(e.target.value)
    const total = endDate.getTime() - startDate.getTime()
    const newTime = startDate.getTime() + (total * progressValue / 100)
    onDateChange(snapToMonth(new Date(newTime)))
  }, [startDate, endDate, onDateChange])

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  // Handle play/pause and speed changes
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(stepForward, playSpeed)
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, playSpeed, stepForward])

  return (
    <div className="timeline-container bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[320px]">
      {/* Current Date Display */}
      <div className="text-center mb-3">
        <span className="text-lg font-bold text-gray-900 dark:text-white">{formattedDate}</span>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {/* Step Backward */}
        <button
          onClick={stepBackward}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Previous month"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {!isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          )}
        </button>

        {/* Step Forward */}
        <button
          onClick={stepForward}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Next month"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </button>

        {/* Speed Control */}
        <select
          value={playSpeed}
          onChange={(e) => setPlaySpeed(Number(e.target.value))}
          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded px-2 py-1.5 text-xs border-0 focus:ring-1 focus:ring-blue-500"
          title="Playback speed"
        >
          {speedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Slider */}
      <div className="relative mb-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{formattedStartDate}</span>
          <span>{formattedEndDate}</span>
        </div>

        <div className="relative">
          {/* Progress bar background */}
          <div className="relative h-4 flex items-center">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Custom thumb */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md pointer-events-none transition-all"
              style={{ left: `${progress}%` }}
            />

            {/* Slider input (invisible, for interaction) */}
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Year markers */}
          <div className="relative h-4 mt-1">
            {yearMarkers.map((marker) => (
              <div
                key={marker.year}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${marker.position}%` }}
              >
                <div className="w-0.5 h-2 bg-gray-400 dark:bg-gray-500" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {marker.year}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
