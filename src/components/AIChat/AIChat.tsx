/**
 * @fileoverview AI聊天组件 - 算法学习助手
 * @description 提供基于AI的算法学习对话功能，支持多模型（通义千问、DeepSeek），
 *              用于解答算法和数据结构相关问题。包含消息收发、代码高亮、
 *              思考过程展示、API密钥管理等核心功能。
 */

import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiSettings, FiCopy, FiCheck } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ConfigService from '../../services/configService';

/** 聊天消息接口定义 */
interface Message {
  role: 'user' | 'assistant';  // 消息角色：用户或AI助手
  content: string;             // 消息内容（支持Markdown格式）
  thinking?: string[];         // AI思考过程（可选，用于展示推理链）
  id: string;                  // 消息唯一标识符
}

/** AI模型接口定义 */
interface AIModel {
  id: string;                  // 模型唯一标识
  name: string;                // 模型显示名称
  provider: string;            // 所属服务商ID
  isNew?: boolean;             // 是否为新模型（可选）
  maxTokens?: number;          // 最大token数限制（可选）
}

/** AI服务提供商接口定义 */
interface AIProvider {
  id: string;                  // 服务商唯一标识
  name: string;                // 服务商显示名称
  apiEndpoint: string;         // API接口地址
  requiresKey: boolean;        // 是否需要API密钥认证
  models: AIModel[];           // 该服务商支持的模型列表
}

/** 支持的AI服务商配置列表 */
const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'qwen',
    name: '通义千问',
    apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    requiresKey: true,
    models: [
      { id: 'qwen-max', name: 'Qwen Max', provider: 'qwen' },
      { id: 'qwen-plus', name: 'Qwen Plus', provider: 'qwen' },
      { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'qwen' },
      { id: 'qwen-coder-plus', name: 'Qwen Coder Plus', provider: 'qwen' },
      { id: 'qwen-vl-max', name: 'Qwen VL Max', provider: 'qwen' }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    requiresKey: true,
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek' }
    ]
  }
];

/** 系统提示词 - 定义AI助手的角色和行为规范 */
const SYSTEM_PROMPT = `你是「算法可视化平台」的专属AI助手，你的唯一职责是帮助用户学习和理解算法与数据结构。你必须严格遵守以下规则：

1. 你只能回答与算法、数据结构、计算复杂度、编程（与算法相关）有关的问题。
2. 如果用户问的问题与算法和数据结构无关（如闲聊、生活、娱乐、政治等），你必须礼貌地拒绝，并引导用户回到算法话题。拒绝时请说："我是算法可视化平台的专属助手，只能回答算法和数据结构相关的问题。请问有什么算法问题我可以帮你解答吗？"
3. 你擅长的领域包括但不限于：排序算法、搜索算法、图论算法、动态规划、贪心算法、回溯算法、递归、数据结构（数组、链表、栈、队列、树、图、哈希表等）、时间空间复杂度分析。
4. 回答时尽量结合本平台已有的算法可视化内容进行引导，例如："你可以在平台的算法页面查看冒泡排序的可视化演示"。
5. 回答要简洁、准确、有教学性，适当举例说明。`;

/**
 * AI聊天主组件
 * @description 实现完整的AI对话界面，包括消息列表、输入框、模型选择、
 *              API密钥配置、代码高亮渲染、消息复制等功能。
 */
export const AIChat: React.FC = () => {
  // ==================== 状态管理 ====================
  const [messages, setMessages] = useState<Message[]>([]);        // 聊天消息列表
  const [input, setInput] = useState('');                          // 当前输入框内容
  const [apiKey, setApiKey] = useState('');                        // API密钥输入（临时）
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AI_PROVIDERS[1]);  // 当前选中的服务商
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_PROVIDERS[1].models[0]);  // 当前选中的模型
  const [isConfigOpen, setIsConfigOpen] = useState(false);          // 是否显示API密钥配置弹窗
  const [showKeyPrompt, setShowKeyPrompt] = useState(true);         // 是否显示密钥提示框
  const [hasDismissedPrompt, setHasDismissedPrompt] = useState(false);  // 用户是否已关闭过提示
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);  // 当前被复制的消息ID
  const messagesEndRef = useRef<HTMLDivElement>(null);              // 消息列表底部引用（用于自动滚动）
  const configService = ConfigService.getInstance();                // 配置服务单例

  // 当切换服务商时，自动选择该服务商的第一个模型
  useEffect(() => {
    setSelectedModel(selectedProvider.models[0]);
  }, [selectedProvider]);

  /**
   * 保存API密钥到配置服务
   * @description 将用户输入的API密钥通过ConfigService持久化存储，
   *              并关闭配置弹窗和提示框
   */
  const handleApiKeySave = () => {
    if (apiKey.trim()) {
      configService.setApiKey(selectedProvider.id, apiKey);
      setIsConfigOpen(false);
      setShowKeyPrompt(false); // 保存密钥后关闭提示
    }
  };

  /**
   * 自动滚动到消息列表底部
   * @description 使用平滑滚动效果，确保最新消息始终可见
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当消息列表更新时，自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 复制消息内容到剪贴板
   * @param text - 要复制的文本内容
   * @param messageId - 消息唯一标识（用于显示复制状态）
   * @description 使用Clipboard API复制文本，并在2秒后重置复制状态图标
   */
  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };



  /**
   * 提交用户消息并获取AI回复
   * @param e - 表单提交事件
   * @description 核心业务逻辑：
   *              1. 验证API密钥是否存在，不存在则弹出配置窗口
   *              2. 构造用户消息并添加到消息列表
   *              3. 根据选中的服务商（通义千问/DeepSeek）调用不同的API接口
   *              4. 解析AI响应，提取内容和思考过程（reasoning_content）
   *              5. 将AI回复添加到消息列表，失败时显示错误提示
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查当前服务商的API密钥是否已配置
    const currentKey = configService.getApiKey(selectedProvider.id);
    if (!currentKey) {
      setIsConfigOpen(true);  // 未配置则打开配置弹窗
      return;
    }

    // 忽略空输入
    if (!input.trim()) return;

    // 构造用户消息对象并添加到消息列表
    const userMessage: Message = {
      role: 'user',
      content: input,
      id: Date.now().toString()  // 使用时间戳作为唯一ID
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');  // 清空输入框

    try {
      let response;
      let assistantMessage: Message;

      // 根据不同服务商调用对应的API接口
      switch (selectedProvider.id) {
        case 'qwen':
          // 调用通义千问API（阿里云DashScope接口）
          response = await fetch(selectedProvider.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey}`
          },
          body: JSON.stringify({
            model: selectedModel.id,
            input: {
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...[...messages, userMessage].map(msg => ({
                  role: msg.role,
                  content: msg.content
                }))
              ]
            },
            parameters: {
              result_format: 'message',
              max_tokens: 1500,
              temperature: 0.7
            }
          })
        });
        
        const qwenData = await response.json();
        
        // 解析通义千问的响应格式（output.choices[0].message）
        if (qwenData.output && qwenData.output.choices && qwenData.output.choices[0]) {
          const choice = qwenData.output.choices[0];
          assistantMessage = {
            role: 'assistant',
            content: choice.message.content,
            id: Date.now().toString()
          };
          
          // 提取并保存AI的思考过程（如果模型返回了推理内容）
          if (choice.message.reasoning_content) {
            assistantMessage.thinking = [choice.message.reasoning_content];
          }
          
          setMessages(prev => [...prev, assistantMessage]);
        }
        break;

      case 'deepseek':
        // 调用DeepSeek API（OpenAI兼容接口格式）
        response = await fetch(selectedProvider.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey}`
          },
          body: JSON.stringify({
            model: selectedModel.id,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...[...messages, userMessage].map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            ],
            stream: false
          })
        });
        
        const deepseekData = await response.json();
        
        // 解析DeepSeek的响应格式（标准OpenAI格式：choices[0].message）
        if (deepseekData.choices && deepseekData.choices[0]) {
          const choice = deepseekData.choices[0];
          assistantMessage = {
            role: 'assistant',
            content: choice.message.content,
            id: Date.now().toString()
          };
          
          // 提取DeepSeek Reasoner模型的思考过程
          if (choice.message.reasoning_content) {
            assistantMessage.thinking = [choice.message.reasoning_content];
          }
          
          setMessages(prev => [...prev, assistantMessage]);
        }
        break;

      default:
        throw new Error('Unknown provider');
    }
  } catch (error) {
    // API调用失败时的错误处理：显示友好的错误提示消息
    console.error('Error:', error);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '抱歉，请求失败。请检查你的API密钥和网络连接。',
      id: Date.now().toString()
    }]);
  }
};

  // ==================== 渲染部分 ====================
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部标题栏：包含标题、模型选择器、设置按钮 */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">算法学习 AI 助手</h1>
        <div className="flex items-center gap-4">
          {/* 服务商和模型选择下拉框 */}
          <div className="flex items-center gap-2">
            <select
              className="border rounded-md px-2 py-1"
              value={selectedProvider.id}
              onChange={(e) => {
                const provider = AI_PROVIDERS.find(p => p.id === e.target.value);
                if (provider) setSelectedProvider(provider);
              }}
            >
              {AI_PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md px-2 py-1"
              value={selectedModel.id}
              onChange={(e) => {
                const model = selectedProvider.models.find(m => m.id === e.target.value);
                if (model) setSelectedModel(model);
              }}
            >
              {selectedProvider.models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="设置 API 密钥"
          >
            <FiSettings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 消息列表区域：显示欢迎界面或聊天记录 */}
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          // 空状态：显示欢迎界面和功能介绍
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="w-32 h-32 mb-8">
              <img 
                src="/robot.svg" 
                alt="AI Assistant" 
                className="w-full h-full opacity-50"
              />
            </div>
            <h2 className="text-xl font-semibold mb-4">算法学习 AI 助手</h2>
            <div className="text-center max-w-md">
              <p className="mb-4">
                我是算法可视化平台的专属助手，可以帮助您：
              </p>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  解答算法和数据结构问题
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  分析时间空间复杂度
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  解释排序、搜索、图论等算法原理
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  引导您使用平台可视化功能学习
                </li>
              </ul>
              <p className="text-sm">
                在下方输入框中输入您的问题，开始对话吧！
              </p>
            </div>
          </div>
        ) : (
          // 有消息时：逐条渲染聊天记录
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                // 根据消息角色调整对齐方式：用户右对齐，AI左对齐
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  // 消息气泡样式：用户消息为蓝色，AI消息为白色带边框
                  className={`inline-block max-w-[80%] p-4 rounded-lg relative ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {/* 显示AI思考过程（如果存在） */}
                  {message.thinking && message.thinking.length > 0 && (
                    <div className="mb-2 text-sm opacity-80 border-b pb-2">
                      <div className="font-semibold mb-1">思考过程：</div>
                      {message.thinking.map((thought, index) => (
                        <div key={index} className="ml-2">• {thought}</div>
                      ))}
                    </div>
                  )}
                  {/* 使用ReactMarkdown渲染Markdown内容，支持代码高亮 */}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 自定义代码块渲染：识别语言并使用SyntaxHighlighter高亮
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={tomorrow}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {/* 消息复制按钮：悬停显示，点击后图标变为勾选 */}
                  <button
                    onClick={() => handleCopy(message.content, message.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
                    title="复制内容"
                  >
                    {copiedMessageId === message.id ? (
                      <FiCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FiCopy className="w-4 h-4 opacity-50 hover:opacity-100" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />  {/* 滚动锚点元素 */}
      </div>

      {/* 底部输入区域：包含输入框和发送按钮 */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您的问题..."
            className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {/* 发送按钮：未配置API密钥时禁用 */}
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
            disabled={!configService.getApiKey(selectedProvider.id)}
          >
            <FiSend />
            发送
          </button>
        </form>
      </div>

      {/* API密钥配置弹窗：模态对话框 */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">设置 API 密钥</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedProvider.name} API 密钥
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`请输入您的 ${selectedProvider.name} API 密钥`}
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleApiKeySave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API密钥首次使用提示：引导用户配置密钥 */}
      {showKeyPrompt && !configService.getApiKey(selectedProvider.id) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40" onClick={() => { setShowKeyPrompt(false); setHasDismissedPrompt(true); }}>
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 max-w-md text-center">
            <h3 className="text-lg font-semibold mb-2">算法学习 AI 助手</h3>
            <p className="text-gray-600 mb-4">
              请点击右上角设置按钮，输入您的 API 密钥以开始使用。
              我只回答算法和数据结构相关的问题哦！
              <br />
              <span className="text-sm">（点击任意位置关闭此提示）</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
