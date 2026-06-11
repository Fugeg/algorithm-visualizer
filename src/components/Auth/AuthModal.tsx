/**
 * @file AuthModal.tsx
 * @description 用户认证弹窗组件 - 登录/注册功能的模态对话框
 *
 * 该组件实现应用的用户身份认证功能，采用模态弹窗的交互形式：
 * - 支持两种模式切换：登录（login）和注册（register）
 * - 集成表单验证：密码长度检查、确认密码一致性校验
 * - 通过 UserService 单例服务与后端 API 交互
 * - 提供成功/失败的状态反馈（消息提示 + 自动关闭）
 *
 * 职责说明：
 * 1. 管理用户登录和注册的完整流程
 * 2. 处理表单数据的双向绑定和客户端验证
 * 3. 调用认证服务执行实际的认证请求
 * 4. 控制模态框的显示/隐藏状态
 *
 * 业务流程：
 * - 登录流程：输入凭据 → 调用 login API → 成功后延迟500ms关闭 → 触发 onLoginSuccess 回调
 * - 注册流程：输入信息 → 前端验证 → 调用 register API → 成功后延迟1000ms关闭 → 触发回调
 *
 * 使用场景：
 * - 用户点击"登录"按钮时弹出
 * - 未登录用户尝试访问需要权限的功能时触发
 */

import React, { useState } from 'react';
import { FiX, FiUser, FiLock, FiMail } from 'react-icons/fi';
import UserService from '../../services/userService';

/**
 * 认证弹窗组件的属性接口定义
 *
 * @interface AuthModalProps
 * @property {boolean} isOpen - 控制弹窗的显示状态（true=显示，false=隐藏）
 * @property {() => void} onClose - 关闭弹窗的回调函数（点击遮罩层或关闭按钮触发）
 * @property {() => void} onLoginSuccess - 认证成功后的回调函数（用于更新父组件状态）
 */
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

/**
 * 认证模式类型定义
 * - 'login': 登录模式，仅需用户名和密码
 * - 'register': 注册模式，需要用户名、邮箱、密码和确认密码
 */
type AuthMode = 'login' | 'register';

/**
 * 用户认证弹窗组件
 *
 * 实现登录/注册双模式的模态对话框，包含完整的表单处理、验证和提交流程。
 * 使用受控组件模式管理表单状态，通过 UserService 单例与后端通信。
 *
 * @param props - 弹窗属性配置对象
 * @returns {JSX.Element} 条件渲染的模态对话框（isOpen=false 时返回 null）
 */
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  // 当前认证模式：默认为登录模式
  const [mode, setMode] = useState<AuthMode>('login');

  // 表单数据状态：统一管理所有输入字段的值
  const [formData, setFormData] = useState({
    username: '',        // 用户名（登录时可接受邮箱）
    email: '',           // 邮箱地址（仅注册模式使用）
    password: '',        // 密码
    confirmPassword: ''  // 确认密码（仅注册模式使用）
  });

  // 错误消息状态：用于显示表单验证错误或API返回的业务错误
  const [error, setError] = useState('');

  // 成功消息状态：用于显示操作成功的反馈提示
  const [success, setSuccess] = useState('');

  // 获取 UserService 单例实例，用于调用认证相关 API
  const userService = UserService.getInstance();

  // 性能优化：当弹窗处于关闭状态时直接返回 null，避免渲染不必要的 DOM 结构
  if (!isOpen) return null;

  /**
   * 处理表单提交事件
   *
   * 根据当前模式（登录/注册）执行不同的业务逻辑：
   *
   * 注册模式：
   * 1. 校验两次密码是否一致
   * 2. 校验密码长度是否满足最低要求（6位）
   * 3. 调用 userService.register() 发送注册请求
   * 4. 成功后显示成功消息，1秒后自动关闭并触发回调
   *
   * 登录模式：
   * 1. 直接调用 userService.login() 发送登录请求
   * 2. 成功后显示成功消息，0.5秒后自动关闭并触发回调
   *
   * @param e - 表单提交事件对象，用于阻止默认的页面刷新行为
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // 阻止表单默认提交行为（避免页面刷新）
    e.preventDefault();

    // 重置之前的状态消息，确保每次提交都从干净状态开始
    setError('');
    setSuccess('');

    if (mode === 'register') {
      // ===== 注册模式的表单验证 =====

      // 验证1：检查两次输入的密码是否一致
      if (formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致');
        return;  // 验证失败，提前退出函数
      }

      // 验证2：检查密码长度是否符合安全要求（至少6个字符）
      if (formData.password.length < 6) {
        setError('密码长度至少6位');
        return;
      }

      // 通过所有前端验证后，调用注册接口
      const result = await userService.register(
        formData.username,
        formData.email,
        formData.password
      );

      if (result.success) {
        // 注册成功：显示成功消息，延迟1秒后关闭弹窗（给用户足够时间阅读提示）
        setSuccess(result.message);
        setTimeout(() => {
          onLoginSuccess();  // 通知父组件更新认证状态
          onClose();          // 关闭弹窗
        }, 1000);
      } else {
        // 注册失败：显示后端返回的错误信息（如用户名已存在等）
        setError(result.message);
      }
    } else {
      // ===== 登录模式：直接调用登录接口 =====
      const result = await userService.login(formData.username, formData.password);
      if (result.success) {
        // 登录成功：显示成功消息，延迟0.5秒后关闭（用户体验更流畅）
        setSuccess(result.message);
        setTimeout(() => {
          onLoginSuccess();
          onClose();
        }, 500);
      } else {
        // 登录失败：显示错误信息（如密码错误、账号不存在等）
        setError(result.message);
      }
    }
  };

  /**
   * 切换登录/注册模式
   *
   * 执行以下清理操作以确保模式切换时的状态一致性：
   * 1. 切换 mode 状态值
   * 2. 清空错误和成功消息
   * 3. 重置所有表单字段为初始空值（防止残留数据混淆用户）
   */
  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* 弹窗主体：白色圆角卡片，最大宽度448px */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        {/* ===== 关闭按钮（右上角） ===== */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          {/* X 图标按钮，悬停时颜色加深 */}
          <FiX className="w-6 h-6" />
        </button>

        {/* ===== 弹窗标题：根据当前模式动态显示 ===== */}
        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === 'login' ? '用户登录' : '用户注册'}
        </h2>

        {/* ===== 错误消息提示区域（条件渲染） ===== */}
        {/* 仅当存在错误信息时显示红色警告框 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* ===== 成功消息提示区域（条件渲染） ===== */}
        {/* 仅当操作成功时显示绿色提示框 */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        {/* ===== 主表单区域 ===== */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ---------- 用户名字段 ---------- */}
          <div>
            {/* 标签文本根据模式动态调整：登录时支持用户名或邮箱 */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'login' ? '用户名/邮箱' : '用户名'}
            </label>
            <div className="relative">
              {/* 左侧图标装饰：用户图标绝对定位在输入框内左侧 */}
              <FiUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={mode === 'login' ? '请输入用户名或邮箱' : '请输入用户名'}
                required  // HTML5 原生必填验证
              />
            </div>
          </div>

          {/* ---------- 邮箱字段（仅注册模式显示） ---------- */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <div className="relative">
                {/* 邮箱图标 */}
                <FiMail className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"  // 使用 email 类型启用浏览器原生邮箱格式验证
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>
          )}

          {/* ---------- 密码字段 ---------- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <div className="relative">
              {/* 锁定图标 */}
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"  // 密码类型：隐藏输入字符
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>

          {/* ---------- 确认密码字段（仅注册模式显示） ---------- */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                确认密码
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="请再次输入密码"
                  required
                />
              </div>
            </div>
          )}

          {/* ===== 提交按钮：全宽主色调按钮 ===== */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            {/* 按钮文字根据当前模式动态变化 */}
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        {/* ===== 模式切换链接区域 ===== */}
        {/* 引导未注册用户去注册，已注册用户来登录 */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            onClick={switchMode}
            className="ml-1 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {/* 切换按钮文字：与上方提示形成问答呼应 */}
            {mode === 'login' ? '立即注册' : '立即登录'}
          </button>
        </div>
      </div>
    </div>
  );
};