/**
 * @file configService.ts
 * @description 配置服务模块 - 负责管理AI API密钥的存储、读取和加密
 * 
 * 该服务采用单例模式，提供统一的API密钥管理接口。
 * 主要职责：
 * - 管理多个AI服务商（OpenAI、Google、Claude等）的API密钥
 * - 使用简单的加密算法对密钥进行存储保护
 * - 通过localStorage实现密钥的持久化存储
 * 
 * @module services/configService
 */

import { simpleHash, simpleUnhash } from '../utils/crypto';

/**
 * API密钥存储结构
 * 支持多个AI服务商的密钥配置
 */
interface APIKeys {
  openai?: string;    // OpenAI API密钥（用于GPT系列模型）
  google?: string;    // Google API密钥（用于Gemini等模型）
  claude?: string;    // Claude API密钥（Anthropic公司）
  [key: string]: string | undefined;  // 支持扩展其他AI服务商
}

/**
 * 配置服务类 - 单例模式实现
 * 
 * 提供API密钥的完整生命周期管理：
 * 1. 初始化时从本地存储加载已保存的密钥
 * 2. 提供密钥的增删改查操作
 * 3. 所有持久化操作自动进行加密/解密处理
 */
class ConfigService {
  /** 单例实例引用 */
  private static instance: ConfigService;
  
  /** 内存中的API密钥缓存（解密后的明文） */
  private apiKeys: APIKeys = {};

  /**
   * 私有构造函数 - 确保只能通过getInstance()创建实例
   * 构造时自动从localStorage加载已保存的密钥
   */
  private constructor() {
    this.loadKeysFromStorage();
  }

  /**
   * 从localStorage加载并解密API密钥
   * 应用启动时调用，恢复之前的密钥配置
   * 
   * 处理流程：
   * 1. 从localStorage读取加密的密钥JSON字符串
   * 2. 解析JSON获取加密数据
   * 3. 对每个密钥值进行解密
   * 4. 存入内存缓存供后续使用
   */
  private loadKeysFromStorage(): void {
    // 从浏览器本地存储读取加密的密钥数据
    const keysJson = localStorage.getItem('apiKeys');
    if (keysJson) {
      try {
        // 解析JSON字符串为对象
        const encryptedKeys: APIKeys = JSON.parse(keysJson);
        this.apiKeys = {};
        
        // 遍历所有服务商，逐个解密密钥
        for (const [provider, encryptedValue] of Object.entries(encryptedKeys)) {
          if (encryptedValue) {
            // 使用自定义解密算法还原明文密钥
            this.apiKeys[provider] = simpleUnhash(encryptedValue as string);
          }
        }
      } catch {
        // JSON解析失败或数据损坏时重置为空对象
        this.apiKeys = {};
      }
    }
  }

  /**
   * 将当前内存中的密钥加密后保存到localStorage
   * 每次修改密钥后自动调用，确保数据持久化
   * 
   * 安全措施：
   * - 明文密钥不会直接写入存储
   * - 使用simpleHash进行可逆加密（混淆而非强加密）
   */
  private saveKeysToStorage(): void {
    const encryptedKeys: Record<string, string> = {};
    
    // 遍历所有密钥，进行加密处理
    for (const [provider, value] of Object.entries(this.apiKeys)) {
      if (value) {
        // 对每个明文密钥进行加密混淆
        encryptedKeys[provider] = simpleHash(value);
      }
    }
    
    // 将加密后的密钥对象序列化为JSON存入localStorage
    localStorage.setItem('apiKeys', JSON.stringify(encryptedKeys));
  }

  /**
   * 获取ConfigService单例实例
   * 
   * 采用懒加载方式，首次调用时创建实例，
   * 后续调用返回同一个实例，确保全局只有一个配置服务
   * 
   * @returns {ConfigService} 配置服务的唯一实例
   * 
   * @example
   * const configService = ConfigService.getInstance();
   * const openaiKey = configService.getApiKey('openai');
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * 获取指定AI服务商的API密钥
   * 
   * @param {string} provider - AI服务商标识符（如 'openai'、'google'、'claude'）
   * @returns {string} 对应的API密钥明文，不存在则返回空字符串
   * 
   * @example
   * const key = configService.getApiKey('openai'); // 获取OpenAI密钥
   */
  public getApiKey(provider: string): string {
    return this.apiKeys[provider] || '';
  }

  /**
   * 设置或更新指定AI服务商的API密钥
   * 
   * 设置后会立即加密并持久化到localStorage，
   * 同时更新内存中的缓存
   * 
   * @param {string} provider - AI服务商标识符
   * @param {string} key - API密钥明文（通常以'sk-'或类似前缀开头）
   * 
   * @example
   * configService.setApiKey('openai', 'sk-xxxxxxxxxxxx');
   */
  public setApiKey(provider: string, key: string): void {
    // 更新内存缓存
    this.apiKeys[provider] = key;
    // 立即持久化到本地存储（含加密）
    this.saveKeysToStorage();
  }

  /**
   * 删除指定AI服务商的API密钥
   * 
   * 从内存和localStorage中同时移除该密钥
   * 
   * @param {string} provider - 要删除的AI服务商标识符
   * 
   * @example
   * configService.removeApiKey('openai'); // 移除OpenAI密钥
   */
  public removeApiKey(provider: string): void {
    // 从内存中删除
    delete this.apiKeys[provider];
    // 同步更新持久化存储
    this.saveKeysToStorage();
  }

  /**
   * 获取所有已配置的API密钥副本
   * 
   * 返回的是浅拷贝对象，修改返回值不会影响内部状态
   * 可用于展示密钥列表或检查配置状态
   * 
   * @returns {APIKeys} 包含所有服务商密键的对象副本
   * 
   * @example
   * const allKeys = configService.getAllApiKeys();
   * console.log(Object.keys(allKeys)); // ['openai', 'google']
   */
  public getAllApiKeys(): APIKeys {
    // 使用展开运算符创建新对象，防止外部直接修改内部状态
    return { ...this.apiKeys };
  }
}

export default ConfigService;
