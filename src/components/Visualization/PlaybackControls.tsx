import React from 'react';
import { PlaybackState } from '../../models/PlaybackController';
import { FiPlay, FiPause, FiSkipForward, FiChevronLeft, FiChevronRight, FiRotateCcw } from 'react-icons/fi';

interface PlaybackControlsProps<T> {
  playbackState: PlaybackState<T>;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onGoToStep: (index: number) => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3, 4];

const PlaybackControls = <T,>({
  playbackState,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onSpeedChange,
  onGoToStep
}: PlaybackControlsProps<T>) => {
  const { isPlaying, speed, currentStepIndex, totalSteps, isComplete } = playbackState;
  const hasSteps = totalSteps > 0;
  const progress = hasSteps ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">播放控制</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {hasSteps ? `${currentStepIndex + 1} / ${totalSteps}` : '0 / 0'}
          </span>
          {isComplete && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">完成</span>
          )}
        </div>
      </div>

      <div className="relative w-full h-2 bg-gray-200 rounded-full cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const stepIndex = Math.floor(ratio * totalSteps);
          if (stepIndex >= 0 && stepIndex < totalSteps) {
            onGoToStep(stepIndex);
          }
        }}
      >
        <div
          className="absolute h-full bg-indigo-500 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onReset}
          disabled={!hasSteps}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="重置"
        >
          <FiRotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onStepBackward}
          disabled={!hasSteps || currentStepIndex <= 0}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="步退"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!hasSteps}
          className="p-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
        </button>

        <button
          onClick={onStepForward}
          disabled={!hasSteps || currentStepIndex >= totalSteps - 1}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="步进"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => onGoToStep(totalSteps - 1)}
          disabled={!hasSteps}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="跳到末尾"
        >
          <FiSkipForward className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className="text-xs text-gray-500 mr-1">速度:</span>
        {SPEED_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              speed === s
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlaybackControls;
