interface APIKeys {
  openai?: string;
  google?: string;
  claude?: string;
}

class ConfigService {
  private static instance: ConfigService;
  private apiKeys: APIKeys = {};

  private constructor() {
    this.loadKeysFromStorage();
    if (!this.apiKeys.deepseek) {
      this.apiKeys.deepseek = 'sk-1352d2bd0b2e4cfa93e174b77de3bc3e';
      this.saveKeysToStorage();
    }
  }

  private simpleHash(str: string): string {
    const shifted = str
      .split('')
      .map((c) => String.fromCharCode(c.charCodeAt(0) + 7))
      .join('');
    return btoa(shifted + '::salt');
  }

  private simpleUnhash(hash: string): string {
    try {
      const decoded = atob(hash);
      if (!decoded.endsWith('::salt')) return '';
      const shifted = decoded.slice(0, -6);
      return shifted
        .split('')
        .map((c) => String.fromCharCode(c.charCodeAt(0) - 7))
        .join('');
    } catch {
      return '';
    }
  }

  private loadKeysFromStorage(): void {
    const keysJson = localStorage.getItem('apiKeys');
    if (keysJson) {
      try {
        const encryptedKeys: APIKeys = JSON.parse(keysJson);
        this.apiKeys = {};
        for (const [provider, encryptedValue] of Object.entries(encryptedKeys)) {
          if (encryptedValue) {
            this.apiKeys[provider as keyof APIKeys] = this.simpleUnhash(encryptedValue as string);
          }
        }
      } catch {
        this.apiKeys = {};
      }
    }
  }

  private saveKeysToStorage(): void {
    const encryptedKeys: Record<string, string> = {};
    for (const [provider, value] of Object.entries(this.apiKeys)) {
      if (value) {
        encryptedKeys[provider] = this.simpleHash(value);
      }
    }
    localStorage.setItem('apiKeys', JSON.stringify(encryptedKeys));
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getApiKey(provider: string): string {
    return this.apiKeys[provider as keyof APIKeys] || '';
  }

  public setApiKey(provider: string, key: string): void {
    this.apiKeys[provider as keyof APIKeys] = key;
    this.saveKeysToStorage();
  }

  public removeApiKey(provider: string): void {
    delete this.apiKeys[provider as keyof APIKeys];
    this.saveKeysToStorage();
  }

  public getAllApiKeys(): APIKeys {
    return { ...this.apiKeys };
  }
}

export default ConfigService;
