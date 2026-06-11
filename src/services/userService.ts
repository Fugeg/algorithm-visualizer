/**
 * @file userService.ts
 * @description 用户服务模块 - 负责用户注册、登录、认证等核心功能
 * 
 * 该服务采用单例模式，提供完整的用户认证管理接口。
 * 主要职责：
 * - 用户注册（用户名/邮箱唯一性校验）
 * - 用户登录（支持用户名或邮箱登录）
 * - 用户会话管理（登录状态维护）
 * - 密码安全处理（使用PBKDF2-SHA256哈希算法）
 * 
 * 安全设计：
 * - 密码使用Web Crypto API进行单向哈希存储
 * - localStorage中仅保存不含密码的安全用户信息
 * - 采用双存储策略分离敏感数据和非敏感数据
 * 
 * @module services/userService
 */

import { hashPassword } from '../utils/crypto';

/**
 * 完整用户数据结构（包含密码哈希）
 * 仅在内部验证时使用，不会直接暴露给外部
 */
interface User {
  id: string;           // 用户唯一标识（基于时间戳生成）
  username: string;     // 登录用户名（唯一）
  email: string;        // 注册邮箱（唯一）
  passwordHash: string; // 密码哈希值（PBKDF2-SHA256加密）
  createdAt: string;    // 账户创建时间（ISO格式）
}

/**
 * 安全用户数据结构（不含密码哈希）
 * 用于localStorage持久化和对外暴露，
 * 确保敏感信息不会泄露到前端存储或组件中
 */
interface SafeUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

/**
 * 用户服务类 - 单例模式实现
 * 
 * 提供用户认证的完整功能链路：
 * 1. 注册流程：验证 → 哈希 → 存储 → 自动登录
 * 2. 登录流程：查找 → 验证 → 会话建立
 * 3. 注销流程：清除会话 → 清理存储
 */
class UserService {
  /** 单例实例引用 */
  private static instance: UserService;
  
  /** 当前登录用户（内存中的会话状态） */
  private currentUser: User | null = null;

  /**
   * 私有构造函数 - 初始化时恢复用户会话
   * 从localStorage读取上次登录的用户信息（安全版本）
   */
  private constructor() {
    this.loadUserFromStorage();
  }

  /**
   * 获取UserService单例实例
   * 
   * 全局唯一的用户服务入口，确保用户状态一致性
   * 
   * @returns {UserService} 用户服务的唯一实例
   */
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * 从localStorage恢复当前用户会话
   * 应用刷新或重新打开时调用，维持登录状态
   * 
   * 注意：
   * - 仅读取SafeUser格式（无passwordHash）
   * - 解析失败时重置为未登录状态
   */
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        // 从localStorage恢复安全用户对象（不含密码哈希）
        this.currentUser = JSON.parse(userJson);
      } catch (e) {
        // 数据损坏时清除无效会话
        this.currentUser = null;
      }
    }
  }

  /**
   * 将完整User对象转换为SafeUser（脱敏处理）
   * 移除passwordHash字段，用于安全存储和展示
   * 
   * @param {User} user - 包含密码哈希的完整用户对象
   * @returns {SafeUser} 不含敏感信息的用户对象
   */
  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };
  }

  /**
   * 从localStorage获取所有注册用户列表
   * 
   * 采用双存储策略：
   * - users: 完整用户数据（含passwordHash，用于登录验证）
   * - safeUsers: 安全用户数据（不含passwordHash，用于列表展示）
   * 
   * 安全提示：
   * - passwordHash是PBKDF2单向哈希，无法逆向还原明文密码
   * - 即使被获取也无法用于登录其他系统
   * 
   * @returns {{users: User[], safeUsers: SafeUser[]}} 双版本用户列表
   */
  private getUsers(): { users: User[], safeUsers: SafeUser[] } {
    // 读取含密码哈希的完整用户数据（用于验证）
    const usersJson = localStorage.getItem('users');
    // 读取不含密码的安全用户数据（用于展示）
    const safeUsersJson = localStorage.getItem('safeUsers');
    
    let users: User[] = [];
    let safeUsers: SafeUser[] = [];
    
    // 安全解析JSON，解析失败时回退到空数组
    if (usersJson) {
      try { users = JSON.parse(usersJson); } catch { users = []; }
    }
    if (safeUsersJson) {
      try { safeUsers = JSON.parse(safeUsersJson); } catch { safeUsers = []; }
    }
    
    return { users, safeUsers };
  }

  /**
   * 将用户列表同步保存到localStorage
   * 同时更新两个存储键以保持数据一致性
   * 
   * @param {User[]} users - 完整用户列表（含密码哈希）
   * @param {SafeUser[]} safeUsers - 安全用户列表（不含密码）
   */
  private saveUsers(users: User[], safeUsers: SafeUser[]): void {
    // 持久化完整用户数据（用于后续登录验证）
    localStorage.setItem('users', JSON.stringify(users));
    // 持久化安全用户数据（用于用户列表展示）
    localStorage.setItem('safeUsers', JSON.stringify(safeUsers));
  }

  /**
   * 用户注册
   * 
   * 注册流程：
   * 1. 校验用户名唯一性
   * 2. 校验邮箱唯一性  
   * 3. 使用PBKDF2对密码进行哈希处理
   * 4. 创建用户对象并双份存储
   * 5. 自动登录新用户（设置当前会话）
   * 
   * @param {string} username - 用户名（2-20字符，字母数字下划线）
   * @param {string} email - 邮箱地址（需符合email格式）
   * @param {string} password - 明文密码（将被立即哈希，不存储原文）
   * @returns {Promise<{success: boolean, message: string}>} 操作结果及提示信息
   * 
   * @example
   * const result = await userService.register('zhangsan', 'zhang@example.com', 'MyPassword123');
   * if (result.success) { console.log('注册成功'); }
   */
  async register(username: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
    // 获取现有用户列表进行重复性检查
    const { users, safeUsers } = this.getUsers();
    
    // 检查用户名是否已被占用
    if (users.find(u => u.username === username)) {
      return { success: false, message: '用户名已存在' };
    }
    
    // 检查邮箱是否已被注册
    if (users.find(u => u.email === email)) {
      return { success: false, message: '邮箱已被注册' };
    }

    // 使用Web Crypto API的PBKDF2算法对密码进行单向哈希
    // 哈希后的值无法逆向，即使数据库泄露也不会暴露原始密码
    const passwordHash = await hashPassword(password);
    
    // 构建新的完整用户对象
    const newUser: User = {
      id: Date.now().toString(),          // 使用时间戳作为唯一ID
      username,
      email,
      passwordHash,                       // 存储哈希值而非明文
      createdAt: new Date().toISOString() // 记录注册时间
    };

    // 创建安全版本用户对象（不含密码哈希）
    const safeNewUser = this.toSafeUser(newUser);
    
    // 同时添加到两个用户列表
    users.push(newUser);
    safeUsers.push(safeNewUser);
    
    // 持久化到localStorage
    this.saveUsers(users, safeUsers);
    
    // 注册成功后自动登录（建立会话）
    // currentUser保留完整User对象用于内部操作
    this.currentUser = newUser;
    // 但localStorage只存SafeUser版本，防止密码哈希泄露
    localStorage.setItem('currentUser', JSON.stringify(safeNewUser));
    
    return { success: true, message: '注册成功' };
  }

  /**
   * 用户登录
   * 
   * 登录流程：
   * 1. 支持用户名或邮箱作为登录凭证
   * 2. 对输入密码进行相同算法的哈希
   * 3. 与存储的密码哈希比对（防时序攻击比较）
   * 4. 验证通过后建立会话
   * 
   * @param {string} usernameOrEmail - 用户名或邮箱地址
   * @param {string} password - 用户输入的明文密码
   * @returns {Promise<{success: boolean, message: string}>} 操作结果及提示信息
   * 
   * @example
   * const result = await userService.login('zhangsan', 'MyPassword123');
   * if (result.success) { console.log('登录成功'); }
   */
  async login(usernameOrEmail: string, password: string): Promise<{ success: boolean; message: string }> {
    // 获取包含密码哈希的完整用户列表
    const { users } = this.getUsers();
    
    // 对用户输入的密码进行哈希（与注册时使用相同算法和参数）
    const passwordHash = await hashPassword(password);
    
    // 查找匹配的用户：用户名或邮箱一致 且 密码哈希匹配
    const user = users.find(u => 
      (u.username === usernameOrEmail || u.email === usernameOrEmail) && 
      u.passwordHash === passwordHash
    );

    // 未找到匹配用户（可能是用户不存在或密码错误）
    if (!user) {
      // 统一错误提示，避免枚举攻击（不明确告知是用户名还是密码错误）
      return { success: false, message: '用户名或密码错误' };
    }

    // 登录成功，建立会话
    // 内存中保留完整User引用（方便内部方法使用）
    this.currentUser = user;
    // localStorage只存储SafeUser（不含密码哈希），增强安全性
    localStorage.setItem('currentUser', JSON.stringify(this.toSafeUser(user)));
    return { success: true, message: '登录成功' };
  }

  /**
   * 用户注销
   * 
   * 清除当前用户会话状态：
   * - 清空内存中的currentUser引用
   * - 移除localStorage中的会话数据
   * 
   * 注意：此操作不会删除用户账户，只是退出登录状态
   */
  logout(): void {
    // 清除内存中的会话状态
    this.currentUser = null;
    // 清除浏览器本地存储的会话数据
    localStorage.removeItem('currentUser');
  }

  /**
   * 获取当前登录用户信息（安全版本）
   * 
   * 返回的用户对象不包含密码哈希字段，
   * 可安全地传递给React组件进行渲染
   * 
   * @returns {SafeUser | null} 当前用户的安全信息，未登录返回null
   * 
   * @example
   * const user = userService.getCurrentUser();
   * if (user) { console.log(`欢迎回来，${user.username}`); }
   */
  getCurrentUser(): SafeUser | null {
    if (!this.currentUser) return null;
    // 返回脱敏后的用户对象
    return this.toSafeUser(this.currentUser);
  }

  /**
   * 检查用户是否已登录
   * 
   * 用于路由守卫、权限控制等场景
   * 
   * @returns {boolean} true表示已登录，false表示未登录
   * 
   * @example
   * if (!userService.isAuthenticated()) {
   *   navigate('/login'); // 未登录则跳转到登录页
   * }
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

export default UserService;
