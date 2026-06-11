/**
 * @fileoverview 代码显示组件
 * @description 用于展示算法源代码，支持语法高亮和当前执行行高亮显示。
 *              基于Prism.js实现代码着色，常用于算法可视化页面中同步展示
 *              当前正在执行的代码行，帮助用户理解算法执行过程。
 */

import React, { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';

/**
 * CodeDisplay组件属性接口
 * @interface CodeDisplayProps
 * @property code - 要显示的源代码字符串
 * @property language - 编程语言标识（如 'javascript', 'python', 'java' 等）
 * @property currentLine - 当前正在执行的行号（从0开始），用于高亮显示
 */
interface CodeDisplayProps {
  code: string;
  language: string;
  currentLine: number;
}

/**
 * 代码显示组件
 * @param props - 组件属性：code（代码内容）、language（语言）、currentLine（当前高亮行）
 * @description 将代码按行分割渲染，对当前执行行添加黄色背景高亮，
 *              并使用Prism.js进行语法高亮处理
 */
const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, language, currentLine }) => {
  // 当代码或当前行号变化时，重新触发Prism语法高亮
  useEffect(() => {
    Prism.highlightAll();
  }, [code, currentLine]);

  // 将代码按换行符分割成行数组
  const lines = code.split('\n');

  return (
    <pre className="relative">
      <code className={`language-${language}`}>
        {/* 逐行渲染代码，当前执行行添加黄色高亮背景 */}
        {lines.map((line, index) => (
          <div 
            key={index} 
            // 当前行号匹配时应用高亮样式
            className={`${index === currentLine ? 'bg-yellow-200' : ''}`}
          >
            {line}
          </div>
        ))}
      </code>
    </pre>
  );
};

export default CodeDisplay;