import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiSettings, FiCopy, FiCheck } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ConfigService from '../../services/configService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string[];
  id: string;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  isNew?: boolean;
  maxTokens?: number;
}

interface AIProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  requiresKey: boolean;
  models: AIModel[];
}

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

const SYSTEM_PROMPT = `你是「算法可视化平台」的专属AI助手，你的唯一职责是帮助用户学习和理解算法与数据结构。你必须严格遵守以下规则：

1. 你只能回答与算法、数据结构、计算复杂度、编程（与算法相关）有关的问题。
2. 如果用户问的问题与算法和数据结构无关（如闲聊、生活、娱乐、政治等），你必须礼貌地拒绝，并引导用户回到算法话题。拒绝时请说："我是算法可视化平台的专属助手，只能回答算法和数据结构相关的问题。请问有什么算法问题我可以帮你解答吗？"
3. 你擅长的领域包括但不限于：排序算法、搜索算法、图论算法、动态规划、贪心算法、回溯算法、递归、数据结构（数组、链表、栈、队列、树、图、哈希表等）、时间空间复杂度分析。
4. 回答时尽量结合本平台已有的算法可视化内容进行引导，例如："你可以在平台的算法页面查看冒泡排序的可视化演示"。
5. 回答要简洁、准确、有教学性，适当举例说明。`;

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AI_PROVIDERS[1]);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_PROVIDERS[1].models[0]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState(true);  
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const configService = ConfigService.getInstance();

  useEffect(() => {
    setSelectedModel(selectedProvider.models[0]);
  }, [selectedProvider]);

  const handleApiKeySave = () => {
    if (apiKey.trim()) {
      configService.setApiKey(selectedProvider.id, apiKey);
      setIsConfigOpen(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const currentKey = configService.getApiKey(selectedProvider.id);
  if (!currentKey) {
    setIsConfigOpen(true);
    return;
  }

  if (!input.trim()) return;

  const userMessage: Message = {
    role: 'user',
    content: input,
    id: Date.now().toString()
  };
  setMessages(prev => [...prev, userMessage]);
  setInput('');

  try {
    let response;
    let assistantMessage: Message;

    switch (selectedProvider.id) {
      case 'qwen':
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
        
        if (qwenData.output && qwenData.output.choices && qwenData.output.choices[0]) {
          const choice = qwenData.output.choices[0];
          assistantMessage = {
            role: 'assistant',
            content: choice.message.content,
            id: Date.now().toString()
          };
          
          // 处理 Qwen 的思考过程（如果存在）
          if (choice.message.reasoning_content) {
            assistantMessage.thinking = [choice.message.reasoning_content];
          }
          
          setMessages(prev => [...prev, assistantMessage]);
        }
        break;

      case 'deepseek':
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
        
        if (deepseekData.choices && deepseekData.choices[0]) {
          const choice = deepseekData.choices[0];
          assistantMessage = {
            role: 'assistant',
            content: choice.message.content,
            id: Date.now().toString()
          };
          
          // 处理 DeepSeek Reasoner 的思考过程
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
    console.error('Error:', error);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '抱歉，请求失败。请检查你的API密钥和网络连接。',
      id: Date.now().toString()
    }]);
  }
};

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">算法学习 AI 助手</h1>
        <div className="flex items-center gap-4">
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

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
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
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block max-w-[80%] p-4 rounded-lg relative ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {message.thinking && message.thinking.length > 0 && (
                    <div className="mb-2 text-sm opacity-80 border-b pb-2">
                      <div className="font-semibold mb-1">思考过程：</div>
                      {message.thinking.map((thought, index) => (
                        <div key={index} className="ml-2">• {thought}</div>
                      ))}
                    </div>
                  )}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您的问题..."
            className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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

      {/* API Key Modal */}
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

      {/* API Key Prompt */}
      {showKeyPrompt && !configService.getApiKey(selectedProvider.id) && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-40" onClick={() => setShowKeyPrompt(false)}>
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
