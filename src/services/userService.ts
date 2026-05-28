interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

class UserService {
  private static instance: UserService;
  private currentUser: User | null = null;

  private constructor() {
    this.loadUserFromStorage();
  }

  private simpleHash(str: string): string {
    const shifted = str
      .split('')
      .map((c) => String.fromCharCode(c.charCodeAt(0) + 7))
      .join('');
    return btoa(shifted + '::salt');
  }

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        this.currentUser = JSON.parse(userJson);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  register(username: string, email: string, password: string): { success: boolean; message: string } {
    const users = this.getUsers();
    
    if (users.find(u => u.username === username)) {
      return { success: false, message: '用户名已存在' };
    }
    
    if (users.find(u => u.email === email)) {
      return { success: false, message: '邮箱已被注册' };
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      email,
      password: this.simpleHash(password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    this.login(username, password);
    
    return { success: true, message: '注册成功' };
  }

  login(usernameOrEmail: string, password: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const user = users.find(u => 
      (u.username === usernameOrEmail || u.email === usernameOrEmail) && 
      u.password === this.simpleHash(password)
    );

    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }

    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return { success: true, message: '登录成功' };
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    // 可以在这里添加其他清理逻辑
    console.log('用户已登出');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  private getUsers(): User[] {
    const usersJson = localStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : [];
  }
}

export default UserService;