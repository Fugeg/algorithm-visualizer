/**
 * @fileoverview 汉诺塔（Hanoi Tower）可视化组件
 * @description 使用SVG渲染经典的汉诺塔递归问题演示界面。
 *              展示三根柱子（A、B、C）上的圆盘分布，支持动画效果展示
 *              圆盘移动过程。是理解递归算法的经典教学案例。
 *
 * @note 汉诺塔规则：
 *       1. 只有一根柱子上的最顶部圆盘可以被移动
 *       2. 大圆盘不能放在小圆盘上面
 *       3. 目标是将所有圆盘从起始柱移动到目标柱
 */

import React from 'react';

/** 圆盘数据接口 */
interface Disk {
  size: number;                    // 圆盘大小标识（1=最小，n=最大）
  position: 'A' | 'B' | 'C';      // 圆盘当前所在柱子位置
}

/**
 * HanoiTower组件属性接口
 * @interface HanoiTowerProps
 * @property disks - 所有圆盘的状态数组
 * @property sourceRod - 当前移动操作的源柱子标识
 * @property targetRod - 当前移动操作的目标柱子标识
 * @property movingDisk - 当前正在移动的圆盘大小（可选，用于高亮和动画）
 */
interface HanoiTowerProps {
  disks: Disk[];
  sourceRod: string;
  targetRod: string;
  movingDisk?: number;
}

/**
 * 汉诺塔可视化组件
 * @param props - 组件属性（见接口定义）
 * @description 使用SVG绘制汉诺塔场景：
 *              - 三根等距排列的柱子（A在左，B在中，C在右）
 *              - 每根柱子有底座和立柱
 *              - 圆盘按大小堆叠，大圆盘在下，小圆盘在上
 *              - 不同大小的圆盘使用不同颜色（基于HSL色相）
 *              - 正在移动的圆盘上浮并添加阴影效果
 *              - 显示当前移动方向的曲线箭头指示
 */
const HanoiTower: React.FC<HanoiTowerProps> = ({
  disks,
  sourceRod,
  targetRod,
  movingDisk
}) => {
  // ==================== 布局尺寸常量 ====================
  const maxDiskWidth = 200;   // 最大圆盘宽度（像素）
  const minDiskWidth = 60;    // 最小圆盘宽度（像素）
  const diskHeight = 20;      // 圆盘高度（像素）
  const rodHeight = 200;      // 柱子高度（像素）
  const rodWidth = 10;        // 柱子宽度（像素）
  const baseHeight = 20;      // 底座高度（像素）

  /**
   * 根据圆盘大小计算实际显示宽度
   * @param size - 圆盘大小标识（1到n）
   * @returns 圆盘的实际像素宽度
   * @description 线性插值：最小的圆盘使用minDiskWidth，最大的使用maxDiskWidth
   */
  const getDiskWidth = (size: number) => {
    const totalDisks = disks.length;
    return minDiskWidth + ((maxDiskWidth - minDiskWidth) * (size - 1)) / (totalDisks - 1);
  };

  /**
   * 获取指定柱子上的所有圆盘（按从下到上顺序）
   * @param rod - 柱子标识（A/B/C）
   * @returns 该柱子上的圆盘数组
   */
  const getDisksOnRod = (rod: 'A' | 'B' | 'C') => {
    return disks.filter(disk => disk.position === rod);
  };

  /**
   * 渲染单根柱子及其上面的所有圆盘
   * @param position - 柱子标识
   * @param x - 柱子在SVG中的X坐标
   * @returns 包含底座、柱子、标签和圆盘的SVG组元素
   */
  const renderRod = (position: 'A' | 'B' | 'C', x: number) => {
    const disksOnRod = getDisksOnRod(position);
    
    return (
      <g key={position}>
        {/* 底座：水平矩形 */}
        <rect
          x={x - 100}
          y={300}
          width={200}
          height={baseHeight}
          fill="#8B4513"  // 棕色（木质纹理感）
        />
        
        {/* 立柱：垂直矩形 */}
        <rect
          x={x - rodWidth/2}
          y={300 - rodHeight}
          width={rodWidth}
          height={rodHeight}
          fill="#8B4513"
        />
        
        {/* 柱子标签文字 */}
        <text
          x={x}
          y={340}
          textAnchor="middle"
          fill="#666"
          fontSize="16"
        >
          {position}
        </text>
        
        {/* 圆盘列表：从下往上堆叠 */}
        {disksOnRod.map((disk, index) => {
          const width = getDiskWidth(disk.size);
          // Y坐标：从底部向上堆叠，每个圆盘间隔2px
          const y = 280 - (index * (diskHeight + 2));
          const isMoving = disk.size === movingDisk;  // 判断是否为正在移动的圆盘
          
          return (
            <g
              key={disk.size}
              // 正在移动的圆盘向上偏移30px并应用过渡动画
              transform={isMoving ? `translate(0, -30)` : ''}
              className={isMoving ? 'transition-transform duration-300' : ''}
            >
              {/* 圆盘本体：带圆角矩形 */}
              <rect
                x={x - width/2}
                y={y}
                width={width}
                height={diskHeight}
                rx={4}  // 圆角半径
                // 颜色根据圆盘大小变化（HSL色相旋转），形成彩虹效果
                fill={`hsl(${disk.size * 30}, 70%, 50%)`}
                className={`transition-all duration-300 ${
                  isMoving ? 'filter drop-shadow-lg' : ''  // 移动中的圆盘添加阴影
                }`}
              />
              {/* 圆盘上的大小数字标签 */}
              <text
                x={x}
                y={y + 15}
                textAnchor="middle"
                fill="white"
                fontSize="12"
              >
                {disk.size}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    /* SVG容器：响应式宽度，固定400px高度 */
    <div className="w-full overflow-x-auto">
      <svg
        width="100%"
        height="400"
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 渲染三根柱子：A(左), B(中), C(右) */}
        {renderRod('A', 200)}
        {renderRod('B', 500)}
        {renderRod('C', 800)}
        
        {/* 当前移动方向指示器：贝塞尔曲线箭头 + 文字说明 */}
        {sourceRod && targetRod && (
          <g>
            {/* 从源柱到目标柱的虚线曲线路径 */}
            <path
              d={`M ${sourceRod === 'A' ? 200 : sourceRod === 'B' ? 500 : 800} 150
                  Q ${sourceRod === 'A' ? 500 : targetRod === 'A' ? 500 : 500} 50
                  ${targetRod === 'A' ? 200 : targetRod === 'B' ? 500 : 800} 150`}
              fill="none"
              stroke="#666"
              strokeWidth="2"
              strokeDasharray="5,5"  // 虚线样式
            />
            {/* 移动方向文字标注 */}
            <text
              x="500"
              y="30"
              textAnchor="middle"
              fill="#666"
              fontSize="14"
            >
              {sourceRod} → {targetRod}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default HanoiTower;
