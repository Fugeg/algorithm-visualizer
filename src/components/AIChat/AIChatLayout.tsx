/**
 * @fileoverview AI聊天页面布局组件
 * @description 作为AI聊天功能的页面级容器，提供基础布局结构。
 *              将AIChat组件包裹在最小高度全屏的灰色背景容器中，
 *              确保聊天界面在不同屏幕尺寸下都能正常显示。
 */

import React from 'react';
import { AIChat } from './AIChat';

/**
 * AI聊天布局组件
 * @description 页面容器组件，为AIChat提供统一的布局样式和背景
 */
const AIChatLayout: React.FC = () => {
  return (
    // 最小高度占满整个视口，使用浅灰色背景
    <div className="min-h-screen bg-gray-50">
      <AIChat />
    </div>
  );
};

export default AIChatLayout;
