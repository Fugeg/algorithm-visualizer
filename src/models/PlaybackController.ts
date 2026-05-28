export interface PlaybackState<T> {
  steps: T[];
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  isComplete: boolean;
  totalSteps: number;
}

export class PlaybackController<T> {
  private steps: T[] = [];
  private currentStepIndex: number = -1;
  private _isPlaying: boolean = false;
  private _isPaused: boolean = false;
  private _speed: number = 1;
  private playbackTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: ((state: PlaybackState<T>) => void)[] = [];
  private baseDelay: number = 500;
  private _isRecording: boolean = false;

  constructor(baseDelay: number = 500) {
    this.baseDelay = baseDelay;
  }

  subscribe(listener: (state: PlaybackState<T>) => void) {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  getState(): PlaybackState<T> {
    return {
      steps: this.steps,
      currentStepIndex: this.currentStepIndex,
      isPlaying: this._isPlaying,
      isPaused: this._isPaused,
      speed: this._speed,
      isComplete: this.currentStepIndex >= this.steps.length - 1 && this.steps.length > 0,
      totalSteps: this.steps.length
    };
  }

  getCurrentStep(): T | null {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  get isPlaying() { return this._isPlaying; }
  get isPaused() { return this._isPaused; }
  get isRecording() { return this._isRecording; }
  get stepCount() { return this.steps.length; }
  get currentIndex() { return this.currentStepIndex; }

  setSteps(steps: T[]) {
    this.stopPlayback();
    this.steps = steps;
    this.currentStepIndex = steps.length > 0 ? 0 : -1;
    this.notify();
  }

  addStep(step: T) {
    this.steps.push(step);
    if (this.currentStepIndex === -1) {
      this.currentStepIndex = 0;
    }
    if (!this._isPlaying) {
      this.currentStepIndex = this.steps.length - 1;
    }
    this.notify();
  }

  startRecording() {
    this._isRecording = true;
    this.steps = [];
    this.currentStepIndex = -1;
  }

  stopRecording() {
    this._isRecording = false;
    if (this.steps.length > 0) {
      this.currentStepIndex = 0;
    }
    this.notify();
  }

  play() {
    if (this.steps.length === 0) return;
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = 0;
    }
    this._isPlaying = true;
    this._isPaused = false;
    this.notify();
    this.scheduleNextStep();
  }

  pause() {
    this._isPaused = true;
    this._isPlaying = false;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.notify();
  }

  resume() {
    if (this.steps.length === 0) return;
    this._isPlaying = true;
    this._isPaused = false;
    this.notify();
    this.scheduleNextStep();
  }

  stepForward() {
    this.stopPlaybackInternal();
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.notify();
    }
  }

  stepBackward() {
    this.stopPlaybackInternal();
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.notify();
    }
  }

  goToStart() {
    this.stopPlaybackInternal();
    if (this.steps.length > 0) {
      this.currentStepIndex = 0;
      this.notify();
    }
  }

  goToEnd() {
    this.stopPlaybackInternal();
    if (this.steps.length > 0) {
      this.currentStepIndex = this.steps.length - 1;
      this.notify();
    }
  }

  goToStep(index: number) {
    if (index >= 0 && index < this.steps.length) {
      this.currentStepIndex = index;
      this.notify();
    }
  }

  setSpeed(speed: number) {
    this._speed = speed;
    this.notify();
    if (this._isPlaying && !this._isPaused) {
      if (this.playbackTimer) {
        clearTimeout(this.playbackTimer);
      }
      this.scheduleNextStep();
    }
  }

  setBaseDelay(delay: number) {
    this.baseDelay = delay;
  }

  reset() {
    this.stopPlaybackInternal();
    this.steps = [];
    this.currentStepIndex = -1;
    this._isRecording = false;
    this.notify();
  }

  private stopPlaybackInternal() {
    this._isPlaying = false;
    this._isPaused = false;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  private stopPlayback() {
    this.stopPlaybackInternal();
  }

  private scheduleNextStep() {
    if (!this._isPlaying || this._isPaused) return;
    if (this.currentStepIndex >= this.steps.length - 1) {
      this._isPlaying = false;
      this.notify();
      return;
    }

    const delay = this.baseDelay / this._speed;
    this.playbackTimer = setTimeout(() => {
      this.currentStepIndex++;
      this.notify();
      this.scheduleNextStep();
    }, delay);
  }
}
