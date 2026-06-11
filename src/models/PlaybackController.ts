/**
 * ============================================================================
 * 播放控制器 - PlaybackController<T>
 * ============================================================================
 *
 * 【角色定位：算法可视化的"录像机/播放器"】
 *
 * 在本项目的架构中，存在明确的职责分离：
 *
 *   ┌──────────────────┐     录制步骤      ┌──────────────────────┐
 *   │  SortingAlgorithm │ ──────────────→  │ PlaybackController    │
 *   │  (Model 层)       │   SortingStep[]   │ (Playback 层)         │
 *   │  职责: 执行算法，  │                  │  职责: 控制播放流程    │
 *   │  在关键节点"拍照" │                  │  (播放/暂停/步进/速度) │
 *   └──────────────────┘                  └──────────┬───────────┘
 *                                                    │
 *                                          推送状态   ▼
 *                                        ┌──────────────────────┐
 *                                        │  UI 组件              │
 *                                        │  (数组可视化/伪代码/  │
 *                                        │   变量面板/进度条)    │
 *                                        └──────────────────────┘
 *
 * 【泛型设计 <T> 的意义】
 * 本类使用泛型 T 来表示步骤类型，使其不绑定于任何特定的 Step 结构。
 * - 对于排序可视化：T = SortingStep（含 array, comparisons, swaps 等）
 * - 对于路径搜索可视化：T = PathfindingStep（含 grid, visitedNodes 等）
 * - 未来扩展新算法时，只需定义新的 Step 类型即可复用此控制器
 *
 * 【核心能力】
 * 1. 步骤管理：接收/存储完整的步骤序列（setSteps）或逐步追加（addStep）
 * 2. 播放控制：play / pause / resume —— 自动定时推进
 * 3. 手动控制：stepForward / stepBackward / goToStep —— 单步调试模式
 * 4. 速度调节：setSpeed —— 0.25x ~ 4x 变速播放
 * 5. 状态通知：通过观察者模式向 UI 组件推送当前播放状态
 * ============================================================================
 */

/**
 * 播放状态接口——描述播放器在某一时刻的完整状态快照
 *
 * UI 组件订阅此状态的变化，据此渲染：
 * - 数组可视化面板（根据 currentStepIndex 取对应步骤的 array）
 * - 进度条位置（currentStepIndex / totalSteps）
 * - 播放/暂停按钮图标（isPlaying / isPaused）
 * - 速度显示（speed）
 */
export interface PlaybackState<T> {
  /**
   * 完整的步骤列表——由 Model 层（如 SortingAlgorithm）生成并传入
   *
   * 本类不修改步骤内容，只维护一个"当前指向第几步"的索引。
   * 这保证了步骤数据的不可变性（immutable），支持安全的回退/跳转。
   */
  steps: T[];
  /**
   * 当前播放位置——指向 steps 数组中的索引
   *
   * 特殊值含义：
   * - -1：尚未开始播放（无步骤或未初始化）
   * - 0 ~ steps.length-1：正在查看某一步骤
   * - steps.length-1 且 isComplete=true：已播放到最后一步
   */
  currentStepIndex: number;
  /** 是否正在自动播放中（用户点击了"播放"按钮且未暂停） */
  isPlaying: boolean;
  /** 是否处于暂停状态（用户点击了"暂停"按钮，可通过"恢复"继续） */
  isPaused: boolean;
  /**
   * 当前播放速度倍率
   *
   * 实际延迟时间 = baseDelay / speed
   * - speed = 0.5 → 延迟翻倍（慢放）
   * - speed = 1.0 → 正常速度（默认）
   * - speed = 2.0 → 延迟减半（2倍速）
   * - speed = 4.0 → 延迟为 1/4（4倍速）
   */
  speed: number;
  /**
   * 是否已播放到最后一步
   *
   * 当 currentStepIndex >= steps.length - 1 且 steps 非空时为 true，
   * UI 可据此显示"重新播放"按钮或自动停止动画。
   */
  isComplete: boolean;
  /** 步骤总数——方便 UI 直接使用，无需再访问 steps.length */
  totalSteps: number;
}

/**
 * 泛型播放控制器——所有算法可视化的通用播放引擎
 *
 * @typeparam T 步骤类型（如 SortingStep、PathfindingStep 等）
 *
 * 【设计模式：观察者模式】
 * UI 组件通过 subscribe() 注册监听器，每当播放状态发生变化
 * （前进一步、后退、跳转、速度改变等），所有监听器都会收到通知。
 * 这实现了播放逻辑与 UI 渲染的彻底解耦。
 */
export class PlaybackController<T> {
  /** 完整的步骤序列——由外部通过 setSteps() 或 addStep() 注入 */
  private steps: T[] = [];
  /** 当前播放位置的索引，初始为 -1 表示"未开始" */
  private currentStepIndex: number = -1;
  /** 是否正在自动播放 */
  private _isPlaying: boolean = false;
  /** 是否处于暂停状态（与 isPlaying 互斥） */
  private _isPaused: boolean = false;
  /** 当前播放速度倍率，默认 1.0（正常速度） */
  private _speed: number = 1;
  /**
   * 定时器引用——用于存储 setTimeout 返回的 ID
   *
   * 在 pause() / stopPlaybackInternal() 中需要用它来取消待执行的调度，
   * 防止暂停后仍然继续自动前进。
   */
  private playbackTimer: ReturnType<typeof setTimeout> | null = null;
  /** 监听器列表——观察者模式的核心数据结构 */
  private listeners: ((state: PlaybackState<T>) => void)[] = [];
  /**
   * 基础延迟时间（毫秒）——速度为 1x 时两步之间的间隔
   *
   * 默认 500ms，即正常速度下每秒推进 2 步。
   * 实际延迟 = baseDelay / speed
   */
  private baseDelay: number = 500;
  /** 是否正处于录制模式（用于区分实时录制 vs 回放已有步骤） */
  private _isRecording: boolean = false;

  constructor(baseDelay: number = 500) {
    this.baseDelay = baseDelay;
  }

  /**
   * 订阅播放状态变化
   *
   * @param listener 状态变化回调函数，每次状态改变时被调用
   * @returns 取消订阅函数——调用即可移除此监听器（避免内存泄漏）
   *
   * 【设计决策：立即推送一次当前状态】
   * 新订阅者注册时会立即收到一次当前状态快照，
   * 这样 UI 组件初始化时无需额外请求状态，简化了集成代码。
   */
  subscribe(listener: (state: PlaybackState<T>) => void) {
    this.listeners.push(listener);
    // 立即推送当前状态，让新订阅者能立即渲染
    listener(this.getState());
    // 返回取消订阅函数，遵循"函数式事件监听"模式
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知所有监听器——内部方法，每次状态变化后调用
   *
   * 通过 getState() 构建最新的状态快照，然后广播给所有订阅者。
   * 这是观察者模式的标准实现。
   */
  private notify() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  /**
   * 获取当前播放状态的只读快照
   *
   * 每次调用都构建一个新的对象（而非返回内部引用），
   * 防止外部代码意外修改内部状态。这是不可变数据模式的实践。
   */
  getState(): PlaybackState<T> {
    return {
      steps: this.steps,
      currentStepIndex: this.currentStepIndex,
      isPlaying: this._isPlaying,
      isPaused: this._isPaused,
      speed: this._speed,
      // 根据当前位置判断是否已完成全部播放
      isComplete: this.currentStepIndex >= this.steps.length - 1 && this.steps.length > 0,
      totalSteps: this.steps.length
    };
  }

  /**
   * 获取当前步骤的数据
   *
   * @returns 当前步骤对象，若无效位置则返回 null
   *
   * UI 组件调用此方法获取需要渲染的具体步骤内容
   * （如排序步骤中的数组快照、比较次数等）。
   */
  getCurrentStep(): T | null {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  // ========== 只读属性访问器 ==========

  get isPlaying() { return this._isPlaying; }
  get isPaused() { return this._isPaused; }
  get isRecording() { return this._isRecording; }
  get stepCount() { return this.steps.length; }
  get currentIndex() { return this.currentStepIndex; }

  // ========== 步骤管理方法 ==========

  /**
   * 设置完整的步骤序列——通常在算法执行完毕后一次性调用
   *
   * 【典型使用场景】
   * SortingAlgorithm.generateBubbleSortSteps() 执行完毕后，
   * 调用 controller.setSteps(algorithm.getSteps()) 将生成的步骤传入。
   *
   * 【行为说明】
   * - 自动停止当前播放（若有）
   * - 重置播放位置到第一步（index=0）
   * - 若步骤列表为空，则位置设为 -1
   * - 立即通知监听器（UI 会渲染第一步）
   */
  setSteps(steps: T[]) {
    // 先停止任何正在进行的播放
    this.stopPlayback();
    this.steps = steps;
    // 有步骤则从第一步开始，否则标记为未开始
    this.currentStepIndex = steps.length > 0 ? 0 : -1;
    this.notify();
  }

  /**
   * 追加单个步骤——用于实时录制模式
   *
   * 与 setSteps() 的一次性注入不同，addStep() 支持逐步追加：
   * - 当非播放状态时：自动跳到最新追加的步骤（实时跟随效果）
   * - 当播放状态时：仅添加到末尾，不改变当前位置（不影响回放）
   *
   * 【典型使用场景】
   * 算法边执行边产生步骤时，每生成一步就调用 addStep()，
   * UI 可以实时看到排序过程的推进。
   */
  addStep(step: T) {
    this.steps.push(step);
    // 第一个步骤到达时，初始化播放位置
    if (this.currentStepIndex === -1) {
      this.currentStepIndex = 0;
    }
    // 非播放状态下自动跟随最新步骤（实时模式）
    if (!this._isPlaying) {
      this.currentStepIndex = this.steps.length - 1;
    }
    this.notify();
  }

  // ========== 录制控制 ==========

  /** 开始录制模式——清空现有步骤，准备接收新步骤 */
  startRecording() {
    this._isRecording = true;
    this.steps = [];
    this.currentStepIndex = -1;
  }

  /** 结束录制模式——将播放位置重置到开头，准备回放 */
  stopRecording() {
    this._isRecording = false;
    if (this.steps.length > 0) {
      this.currentStepIndex = 0;
    }
    this.notify();
  }

  // ========== 播放控制方法 ==========

  /**
   * ========================================================================
   * play() —— 开始自动播放
   * ========================================================================
   *
   * 【播放流程详解】
   *
   *  ① 前置检查
   *     - 若无步骤（steps 为空），直接返回
   *     - 若已在最后一步，则回到开头（循环播放行为）
   *
   *  ② 状态切换
   *     - 设 isPlaying = true, isPaused = false
   *     - 通知 UI 更新按钮状态（播放→暂停图标切换）
   *
   *  ③ 启动调度循环
   *     - 调用 scheduleNextStep() 启动定时器
   *     - 之后每隔 (baseDelay / speed) 毫秒自动前进一步
   *     - 到达最后一步后自动停止（isComplete = true）
   *
   * 【与 resume() 的区别】
   * - play(): 从当前位置开始（如果在末尾则从头开始）
   * - resume(): 仅从暂停处恢复（不会重置到开头）
   * ========================================================================
   */
  play() {
    // 无步骤可播放
    if (this.steps.length === 0) return;
    // 如果已经在最后一步，重新从头开始
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = 0;
    }
    // 切换到播放状态
    this._isPlaying = true;
    this._isPaused = false;
    this.notify();
    // 启动自动推进循环
    this.scheduleNextStep();
  }

  /**
   * pause() —— 暂停播放
   *
   * 行为：
   * - 标记为暂停状态（isPaused=true, isPlaying=false）
   * - 清除待执行的定时器（防止暂停后仍继续推进）
   * - 不改变当前播放位置（恢复时可从此处继续）
   *
   * 用户再次操作时可通过 resume() 从此处恢复，
   * 或通过 stepForward/stepBackward 进入手动模式。
   */
  pause() {
    this._isPaused = true;
    this._isPlaying = false;
    // 关键：清除定时器，否则回调仍会执行
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.notify();
  }

  /**
   * resume() —— 从暂停处恢复播放
   *
   * 与 play() 的区别：不会重置到开头，
   * 仅恢复之前暂停时的自动推进循环。
   */
  resume() {
    if (this.steps.length === 0) return;
    this._isPlaying = true;
    this._isPaused = false;
    this.notify();
    this.scheduleNextStep();
  }

  /**
   * ========================================================================
   * stepForward() —— 单步前进（手动调试模式）
   * ========================================================================
   *
   * 【设计意图】教学场景下的逐帧分析
   *
   * 在教学演示中，教师往往需要：
   * - 每点击一次"下一步"，讲解当前步骤的含义
   * - 充分时间让学生理解后再进入下一步
   * - 能够随时后退回顾之前的步骤
   *
   * 因此 stepForward/stepBackward 提供了完全的手动控制能力。
   *
   * 【行为说明】
   * - 先停止自动播放（如果正在播放的话）
   * - 将 currentStepIndex + 1（如果不超出边界）
   * - 通知 UI 渲染新步骤
   * ========================================================================
   */
  stepForward() {
    // 停止自动播放，进入纯手动模式
    this.stopPlaybackInternal();
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.notify();
    }
  }

  /**
   * stepBackward() —— 单步后退（手动调试模式）
   *
   * 与 stepForward 对称，将播放位置回退一步。
   * 同样会先停止自动播放。
   */
  stepBackward() {
    this.stopPlaybackInternal();
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.notify();
    }
  }

  /** 跳转到第一步（进度条的"回到开头"功能） */
  goToStart() {
    this.stopPlaybackInternal();
    if (this.steps.length > 0) {
      this.currentStepIndex = 0;
      this.notify();
    }
  }

  /** 跳转到最后一步（进度条的"跳到结尾"功能） */
  goToEnd() {
    this.stopPlaybackInternal();
    if (this.steps.length > 0) {
      this.currentStepIndex = this.steps.length - 1;
      this.notify();
    }
  }

  /**
   * ========================================================================
   * goToStep(index) —— 跳转到指定步骤（进度条拖拽/点击）
   * ========================================================================
   *
   * 【典型触发场景】
   * - 用户点击进度条的某个位置
   * - 用户拖拽进度条滑块到某个位置
   * - 程序逻辑需要直接跳到某个关键步骤（如"跳到分区完成时刻"）
   *
   * 【边界保护】
   * index 必须在 [0, steps.length) 范围内，越界请求会被忽略。
   * 这防止了因 UI 事件异常导致的非法状态。
   *
   * 【注意】
   * 此方法不会自动停止播放。如果当前正在自动播放，
   * 跳转后播放会从新位置继续。如果需要在跳转时停止播放，
   * 应先调用 stopPlaybackInternal() 再调用 goToStep()。
   * ========================================================================
   */
  goToStep(index: number) {
    if (index >= 0 && index < this.steps.length) {
      this.currentStepIndex = index;
      this.notify();
    }
  }

  /**
   * ========================================================================
   * setSpeed(speed) —— 调节播放速度
   * ========================================================================
   *
   * 【实现原理】
   * 速度调节的本质是改变两步之间的**等待时间**：
   *
   *   实际延迟(ms) = baseDelay(基准延迟) / speed(倍率)
   *
   *   speed 值示例（假设 baseDelay = 500ms）：
   *   ┌───────┬────────────┬─────────────────┐
   *   │ speed │  延迟时间   │  效果            │
   *   ├───────┼────────────┼─────────────────┤
   *   │ 0.25  │ 2000ms     │ 极慢（每2秒1步）  │
   *   │ 0.5   │ 1000ms     │ 慢速（每秒1步）   │
   *   │ 1.0   │ 500ms      │ 正常（默认）      │
   *   │ 2.0   │ 250ms      │ 2倍速            │
   *   │ 4.0   │ 125ms      │ 4倍速            │
   *   └───────┴────────────┴─────────────────┘
   *
   * 【变速生效时机】
   * - 若正在播放：清除旧定时器，以新速度重新调度下一步（立即生效）
   * - 若未播放：仅更新 speed 值，下次 play() 时使用新速度
   * ========================================================================
   */
  setSpeed(speed: number) {
    this._speed = speed;
    this.notify();  // 通知 UI 更新速度显示
    // 如果正在播放，需要重新调度以使新速度立即生效
    if (this._isPlaying && !this._isPaused) {
      // 清除旧的定时器（以旧速度计算的延迟）
      if (this.playbackTimer) {
        clearTimeout(this.playbackTimer);
      }
      // 以新速度重新调度
      this.scheduleNextStep();
    }
  }

  /** 修改基础延迟时间（影响所有速度档位的实际延迟） */
  setBaseDelay(delay: number) {
    this.baseDelay = delay;
  }

  /**
   * reset() —— 完全重置播放器状态
   *
   * 清除所有步骤、重置所有标志位、停止播放。
   * 相当于"新建一个干净的播放器"。
   * 通常在切换算法或重新生成数据时调用。
   */
  reset() {
    this.stopPlaybackInternal();
    this.steps = [];
    this.currentStepIndex = -1;
    this._isRecording = false;
    this.notify();
  }

  // ========== 内部辅助方法 ==========

  /**
   * stopPlaybackInternal() —— 内部使用的停止播放方法
   *
   * 执行以下操作：
   * 1. 将 isPlaying 和 isPaused 都设为 false
   * 2. 清除定时器（如果有）
   *
   * 被 stepForward/stepBackward/goToStart/goToEnd/reset 等方法调用，
   * 这些方法都需要确保自动播放已停止才能安全地手动调整位置。
   */
  private stopPlaybackInternal() {
    this._isPlaying = false;
    this._isPaused = false;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  /** 公开的停止播放接口（内部委托给 stopPlaybackInternal） */
  private stopPlayback() {
    this.stopPlaybackInternal();
  }

  /**
   * ========================================================================
   * scheduleNextStep() —— 核心调度循环（私有方法）
   * ========================================================================
   *
   * 【这是整个播放控制器的"心脏"】
   *
   * 采用 **setTimeout + 递归调用自身** 的模式实现定时推进：
   *
   *   scheduleNextStep()
   *        │
   *        ├─ 检查是否仍在播放 & 未暂停 → 否则直接返回
   *        ├─ 检查是否已到最后一步 → 是则停止播放，通知完成
   *        │
   *        ├─ 计算 delay = baseDelay / speed
   *        │
   *        └─ setTimeout(() => {
   *              currentStepIndex++          // 前进一步
   *              notify()                     // 通知 UI 更新
   *              scheduleNextStep()           // ★ 递归！调度下一步
   *            }, delay)
   *
   * 【为什么用 setTimeout 递归而不是 setInterval？】
   * 1. **动态延迟**：每次调度时可以重新计算 delay（支持变速）
   * 2. **精确控制**：每步完成后才调度下一步，避免"堆积"问题
   * 3. **易于取消**：只需 clearTimeout 一个引用即可完全停止
   * 4. **避免漂移**：setInterval 可能因任务执行时间导致延迟累积
   *
   * 【执行时序图】（假设 baseDelay=500ms, speed=1x）
   *
   *   时间轴:  0ms     500ms    1000ms   1500ms
   *            │       │        │        │
   *   play() ──┤       │        │        │
   *            │  sched │  sched  │  sched  │
   *            │    ↓   │    ↓   │    ↓   │
   *   步骤:    │  step0 │  step1 │  step2 │ ...
   *            │        │        │        │
   *   notify:  │  ●     │  ●     │  ●     │
   *
   * ========================================================================
   */
  private scheduleNextStep() {
    // 前置条件检查：必须处于播放状态且未暂停
    if (!this._isPlaying || this._isPaused) return;

    // 边界检查：是否已经到达最后一步
    if (this.currentStepIndex >= this.steps.length - 1) {
      // 播放完毕，停止并通知
      this._isPlaying = false;
      this.notify();
      return;
    }

    // 根据当前速度计算实际延迟时间
    const delay = this.baseDelay / this._speed;

    // 设置定时器：delay 毫秒后执行一步前进
    this.playbackTimer = setTimeout(() => {
      // 前进到下一步
      this.currentStepIndex++;
      // 通知所有监听器（UI 会渲染新步骤）
      this.notify();
      // ★ 递归调度下一步——形成连续的自动播放循环
      this.scheduleNextStep();
    }, delay);
  }
}
