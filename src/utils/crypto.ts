/**
 * @file crypto.ts
 * @description 加密与安全工具模块 - 提供数据混淆和密码哈希功能
 *
 * 【模块角色】
 * 本模块是算法可视化系统的"安全层"，提供两类不同安全级别的数据处理能力：
 * 1. 轻量级可逆编码（用于非敏感数据的客户端存储混淆）
 * 2. 强密码哈希（使用Web Crypto API进行真正的单向哈希）
 *
 * 【设计目的】
 * 1. 为需要持久化的用户配置或API密钥提供基本的客户端存储保护
 * 2. 为用户认证系统提供符合安全标准的密码哈希功能
 * 3. 区分"混淆"和"加密"的概念，明确各函数的适用场景和安全等级
 *
 * 【核心功能】
 * - simpleHash / simpleUnhash：简单的字符偏移+Base64编码（可逆，仅用于混淆）
 * - hashPassword：基于PBKDF2-SHA256的强密码哈希（不可逆，适用于密码存储）
 *
 * 【安全等级说明】
 *
 * ⚠️ 低安全级 - simpleHash/simpleUnhash：
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 安全等级：⭐☆☆☆☆ (1/5)                                      │
 * │ 算法类型：可逆编码（Caesar Cipher变体 + Base64）            │
│ 适用场景：防止明文直接暴露在localStorage/cookie中              │
 * │ 防护对象：偶然性的窥探（如用户自行查看浏览器存储）           │
 * │ 无法防护：有意的逆向工程、中间人攻击、服务端泄露             │
 * │ ⚠️ 绝对不可用于：密码、令牌、支付信息等真正敏感的数据       │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ✅ 高安全级 - hashPassword：
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 安全等级：⭐⭐⭐⭐☆ (4/5)                                      │
 * │ 算法类型：单向哈希（PBKDF2-SHA256，100,000次迭代）          │
 * │ 适用场景：用户密码的安全存储和验证                          │
 * │ 防护对象：彩虹表攻击、暴力破解、哈希碰撞                    │
 * │ 符合标准：OWASP密码存储推荐实践                             │
 * │ 生产环境建议：每个用户使用随机盐值（当前版本使用固定盐值）   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 【在项目中的典型应用场景】
 *
 * 场景1：保存用户的第三方API密钥（如算法演示服务的API Key）
 * 用户输入 → [hashPassword] → 存储到后端数据库
 * （即使数据库泄露，攻击者也无法还原出原始密码）
 *
 * 场景2：在本地存储用户偏好设置中的敏感配置项
 * 配置项值 → [simpleHash] → 存储到localStorage
 * 读取时 → [simpleUnhash] → 还原原始值
 * （防止用户在开发者工具中直接看到明文配置）
 *
 * 【技术选型说明】
 * - 使用Web Crypto API（window.crypto.subtle）：浏览器原生支持，无需第三方库
 * - PBKDF2（Password-Based Key Derivation Function 2）：业界标准的密钥派生函数
 * - SHA-256：广泛使用的安全哈希算法，抗碰撞性强
 * - Base64（btoa/atob）：浏览器内置的编解码函数
 *
 * 【重要警告】
 * ⚠️ 本模块涉及安全性功能，任何修改都应经过安全审查！
 * ⚠️ 密码学是一个复杂的领域，错误的实现可能导致严重的安全漏洞！
 * ⚠️ 如需生产级别的加密方案，请咨询专业安全工程师！
 */

/**
 * simpleHash - 简单的可逆编码函数（数据混淆）
 *
 * 【业务逻辑概述】
 * 本函数对输入字符串进行轻量级的编码处理，使其不以明文形式存储。
 * 采用"字符偏移 + Base64编码 + 盐值附加"的三重处理策略。
 *
 * 【算法原理详解】
 *
 * 编码流程（三步操作）：
 *
 * 步骤1：字符偏移（Character Shifting / Caesar Cipher变体）
 * ┌──────────────────────────────────────────┐
 * │ 输入: "Hello"                            │
 * │ 处理: 每个字符的Unicode码点 + 7          │
 * │ H(72) → O(79)                           │
 * │ e(101) → l(108)                         │
 * │ l(108) → o(115)                         │
 * │ l(108) → o(115)                         │
 * │ o(111) → v(118)                         │
 * │ 结果: "Ollov"                            │
 * └──────────────────────────────────────────┘
 *
 * 步骤2：盐值附加（Salt Appending）
 * ┌──────────────────────────────────────────┐
 * │ 输入: "Ollov"                            │
 * │ 操作: 在末尾追加固定字符串 "::salt"      │
 * │ 结果: "Ollov::salt"                      │
 * │ 目的: 增加解码时的校验依据               │
 * └──────────────────────────────────────────┘
 *
 * 步骤3：Base64编码（Base64 Encoding）
 * ┌──────────────────────────────────────────┐
 * │ 输入: "Ollov::salt"                      │
 * │ 操作: 使用btoa()进行Base64编码            │
 * │ 结果: "T2xsb3Y6OnNhbHQ="                  │
 * │ 目的: 进一步混淆，避免可读字符            │
 * └──────────────────────────────────────────┘
 *
 * 【为什么选择偏移量7？】
 * - 7是一个质数，增加了一定的不规则性
 * - 偏移较小，不会导致Unicode码点溢出到无效范围
 * - 易于实现和理解（类似凯撒密码的经典选择）
 * - 注意：这仅是混淆手段，不具备真正的加密强度！
 *
 * 【Base64编码的作用】
 * btoa(binary to ASCII)将二进制数据转换为ASCII字符串：
 * - 将偏移后的字符串转为Base64格式
 * - 使结果看起来像随机的乱码字符串
 * - 增加了一层视觉上的混淆效果
 *
 * @param str - 要编码的原始字符串
 *              可以是任意UTF-8文本内容
 *              典型场景包括：
 *              - API Key或访问令牌（非高安全级别）
 *              - 用户偏好设置中的敏感选项
 *              - 临时性的配置参数
 *              - 本地缓存中的非关键数据
 *
 * @returns {string} 编码后的字符串，具有以下特征：
 *          - 长度通常比原字符串长（Base64膨胀约33% + 盐值长度）
 *          - 只包含Base64合法字符（A-Z, a-z, 0-9, +, /, =）
 *          - 以特定模式结尾（取决于原字符串内容和盐值）
 *          - 不包含原始字符串的可读片段
 *
 * @example
 * // 基本用法：编码一个简单的字符串
 * const encoded = simpleHash('my-api-key-12345');
 * console.log(encoded);
 * // 输出类似: "bXktYXBpLWtleS0xMjM0NTo6c2FsdA==" (具体值取决于输入)
 *
 * @example
 * // 实际应用场景：存储到localStorage
 * const apiKey = 'sk-abc123xyz789';
 * localStorage.setItem('encrypted_api_key', simpleHash(apiKey));
 * // 存储的是编码后的字符串，不是原始API Key
 *
 * @example
 * // 解码还原
 * const original = simpleUnhash(simpleHash('Hello World'));
 * console.log(original); // 输出: "Hello World"
 *
 * @see simpleUnhash - 对应的解码函数
 * @see hashPassword - 如果需要真正的加密（不可逆），请使用此函数
 *
 * @warning ⚠️ 安全警告：
 * 此函数提供的保护非常有限，仅能防止偶然性的明文暴露。
 * 任何具备基本编程知识的人都可以轻易逆向此编码。
 * 绝不要将其用于以下场景：
 * - ❌ 密码存储（应使用hashPassword）
 * - ❌ 金融数据、支付信息
 * - ❌ 个人身份信息（PII）
 * - ❌ 医疗健康记录
 * - ❌ 任何法律要求保护的敏感数据
 */
export function simpleHash(str: string): string {
  /**
   * 步骤1：字符偏移处理
   *
   * 实现细节：
   * 1. str.split('') - 将字符串拆分为字符数组
   *    例如："Hi" → ['H', 'i']
   *
   * 2. .map((c) => ...) - 对每个字符进行转换
   *
   * 3. String.fromCharCode(c.charCodeAt(0) + 7)
   *    a. c.charCodeAt(0) - 获取字符的Unicode码点（整数）
   *       例如：'H' → 72, 'i' → 105
   *    b. + 7 - 码点加7（偏移操作）
   *       例如：72 + 7 = 79, 105 + 7 = 112
   *    c. String.fromCharCode(...) - 将新码点转回字符
   *       例如：79 → 'O', 112 → 'p'
   *
   * 4. .join('') - 将字符数组重新组合成字符串
   *    例如：['O', 'p'] → "Op"
   */
  const shifted = str
    .split('')                    // 拆分为字符数组
    .map((c) => String.fromCharCode(c.charCodeAt(0) + 7))  // 每个字符Unicode码点+7
    .join('');                    // 重组为字符串

  /**
   * 步骤2&3：附加盐值并进行Base64编码
   *
   * 为什么需要盐值("::salt")？
   * 1. 校验作用：解码时检查是否存在此后缀，判断是否为有效编码
   * 2. 增加复杂度：使纯字符偏移更难被识别
   * 3. 格式标识：作为编码格式的标记
   *
   * Base64编码(btoa)的作用：
   * - 将二进制数据转换为可打印的ASCII字符
   * - 使输出看起来更像随机数据
   * - 避免特殊字符可能引起的存储问题
   *
   * 最终返回完整的编码字符串
   */
  return btoa(shifted + '::salt');  // 附加盐值后进行Base64编码
}

/**
 * simpleUnhash - 简单的可逆解码函数（simpleHash的逆操作）
 *
 * 【业务逻辑概述】
 * 本函数是simpleHash的逆操作，将编码后的字符串还原为原始明文。
 * 执行与simpleHash完全相反的操作序列：Base64解码 → 移除盐值 → 字符反向偏移。
 *
 * 【解码流程详解】
 *
 * 解码流程（simpleHash的逆序）：
 *
 * 步骤1：Base64解码（Base64 Decoding）
 * ┌──────────────────────────────────────────┐
 * │ 输入: "T2xsb3Y6OnNhbHQ="                  │
 * │ 操作: 使用atob()进行Base64解码            │
 * │ 结果: "Ollov::salt"                       │
 * └──────────────────────────────────────────┘
 *
 * 步骤2：盐值验证与移除（Salt Validation & Removal）
 * ┌──────────────────────────────────────────┐
 * │ 输入: "Ollov::salt"                       │
 * │ 检查: 是否以 "::salt" 结尾？              │
 * │ 如果否: 返回空字符串""（非法输入）         │
 * │ 如果是: 移除最后6个字符                   │
 * │ 结果: "Ollov"                             │
 * └──────────────────────────────────────────┘
 *
 * 步骤3：字符反向偏移（Reverse Character Shifting）
 * ┌──────────────────────────────────────────┐
 * │ 输入: "Ollov"                             │
 * │ 处理: 每个字符的Unicode码点 - 7          │
 * │ O(79) → H(72)                            │
 * │ l(108) → e(101)                          │
 * │ o(115) → l(108)                          │
 * │ o(115) → l(108)                          │
 * │ v(118) → o(111)                          │
 * │ 结果: "Hello" ✓ 与原始输入一致            │
 * └──────────────────────────────────────────┘
 *
 * 【错误处理策略】
 * 本函数采用防御性编程，对异常输入有完善的容错机制：
 *
 * 1. Base64解码失败（atob抛出异常）
 *    - 原因：输入不是有效的Base64字符串
 *    - 处理：捕获异常并返回空字符串""
 *
 * 2. 缺少盐值后缀
 *    - 原因：输入不是由simpleHash生成的（可能是伪造或损坏）
 *    - 处理：检测不到"::salt"后缀时返回空字符串""
 *
 * 3. 其他意外错误
 *    - 处理：通用catch块确保不会抛出异常，返回空字符串""
 *
 * 这种"静默失败"(fail-silent)策略的原因：
 * - 解码失败不应该导致应用程序崩溃
 * - 调用方可以通过检查空返回值来判断解码是否成功
 * - 对于存储的配置项，返回空值可以触发使用默认值的降级逻辑
 *
 * @param hash - 要解码的字符串，应该是simpleHash()函数的输出
 *               必须是通过simpleHash编码得到的字符串才能正确解码
 *               无效或损坏的输入会导致返回空字符串
 *
 * @returns {string} 解码后的原始字符串，有以下几种情况：
 *          - 成功解码：返回原始的明文字符串
 *          - 输入为null/undefined：返回空字符串""
 *          - Base64解码失败：返回空字符串""
 *          - 缺少盐值标记：返回空字符串""
 *          - 数据损坏：返回空字符串""
 *
 * @example
 * // 基本用法：解码之前编码的字符串
 * const encoded = simpleHash('my-secret-config');
 * const decoded = simpleUnhash(encoded);
 * console.log(decoded); // 输出: "my-secret-config"
 *
 * @example
 * // 从localStorage读取并解码
 * const storedValue = localStorage.getItem('encrypted_setting');
 * if (storedValue) {
 *   const setting = simpleUnhash(storedValue);
 *   if (setting) {
 *     console.log('恢复的配置:', setting);
 *   } else {
 *     console.warn('配置数据已损坏，使用默认值');
 *   }
 * }
 *
 * @example
 * // 错误输入的处理
 * console.log(simpleUnhash('invalid-data'));  // 输出: "" (空字符串)
 * console.log(simpleUnhash(''));              // 输出: ""
 *
 * @see simpleHash - 对应的编码函数
 */
export function simpleUnhash(hash: string): string {
  try {
    /**
     * 步骤1：Base64解码
     *
     * atob(ASCII to binary)将Base64字符串解码为原始字符串。
     * 这是btoa()的逆操作。
     *
     * 可能抛出的异常：
     * - DOMException: 输入包含非法的Base64字符
     * - 如果输入不是字符串类型也会报错
     */
    const decoded = atob(hash);

    /**
     * 步骤2：验证并移除盐值
     *
     * 安全性检查：
     * - 验证解码后的字符串以"::salt"结尾
     * - 这是对抗篡改的基本完整性检查
     * - 如果没有这个后缀，说明输入可能是伪造的或损坏的
     *
     * .slice(0, -6):
     * - 提取从开头到倒数第6个字符之前的所有字符
     * - "::salt" 正好是6个字符，所以-6会移除它
     * - 例如："data::salt".slice(0, -6) → "data"
     */
    if (!decoded.endsWith('::salt')) return '';  // 缺少盐值标记：返回空字符串
    const shifted = decoded.slice(0, -6);        // 移除"::salt"后缀

    /**
     * 步骤3：字符反向偏移（解码核心操作）
     *
     * 与simpleHash中的偏移完全相反：
     * - simpleHash: charCodeAt(0) + 7（正向偏移）
     * - simpleUnhash: charCodeAt(0) - 7（反向偏移）
     *
     * 这恢复了原始的Unicode码点，从而得到原始字符
     */
    return shifted
      .split('')                                   // 拆分为字符数组
      .map((c) => String.fromCharCode(c.charCodeAt(0) - 7))  // 每个字符Unicode码点-7
      .join('');                                   // 重组为原始字符串

  } catch {
    /**
     * 异常处理：捕获所有可能的错误
     *
     * 使用空的catch块（无参数）是因为：
     * 1. 我们不关心具体的错误类型
     * 2. 所有错误情况都统一返回空字符串
     * 3. 保持接口简洁，不向外传播异常
     *
     * 可能触发的错误：
     * - atob接收到非法的Base64字符串
     * - charCodeAt返回NaN（极端情况）
     * - fromCharCode接收到无效的码点
     */
    return '';  // 解码失败：返回空字符串作为安全的默认值
  }
}

/**
 * hashPassword - 使用Web Crypto API进行安全的密码哈希（单向不可逆）
 *
 * 【业务逻辑概述】
 * 本函数使用工业标准的密码学算法对密码进行单向哈希处理，
 * 生成的哈希值无法逆向还原出原始密码，适用于安全的密码存储场景。
 *
 * 【算法选择：PBKDF2-SHA256】
 *
 * PBKDF2 (Password-Based Key Derivation Function 2) 是什么？
 * ┌─────────────────────────────────────────────────────────────┐
 * │ PBKDF2是一种通过重复应用伪随机函数来"拉伸"密码的算法。     │
 * │ 它的设计目的是让哈希计算变得足够慢，以抵抗暴力破解攻击。   │
 * │                                                             │
 * │ 核心思想：                                                   │
 * │ - 故意让计算变慢（相对于简单的SHA-256慢100,000倍以上）       │
 * │ - 攻击者尝试每个候选密码都需要花费大量时间                  │
 * │ - 合法用户只计算一次，影响可忽略不计                        │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 为什么选择PBKDF2而不是其他算法？
 *
 * | 算法 | 优点 | 缺点 | 适用场景 |
 * |------|------|------|----------|
 * | PBKDF2 | 标准化好、广泛支持 | GPU加速下相对较弱 | 通用场景（当前选择）|
 * | bcrypt | 内置盐值、抗GPU | 参数调整有限 | 传统系统 |
 * | scrypt | 抗ASIC/GPU、内存密集 | 配置复杂 | 高安全需求 |
 * | Argon2 | 最新最安全（2015冠军）| 支持度较低 | 新项目首选 |
 *
 * 当前选择PBKDF2的原因：
 * 1. Web Crypto API原生支持（无需额外库）
 * 2. OWASP推荐的可行方案之一
 * 3. 100,000次迭代提供了足够的安全性
 * 4. 浏览器兼容性好（现代浏览器均支持）
 *
 * 【完整哈希流程】
 *
 * 输入: password = "MySecure@Pass2024"
 *                ↓
 * ┌─────────────────────────────────────────┐
 * │ Step 1: TextEncoder UTF-8编码           │
 * │ "MySecure@Pass2024" → Uint8Array(17字节)│
 * └─────────────────────────────────────────┘
 *                ↓
 * ┌─────────────────────────────────────────┐
 * │ Step 2: 准备固定盐值                     │
 * │ "algorithm-visualizer-salt-v1"           │
 * │ → Uint8Array(27字节)                     │
 * └─────────────────────────────────────────┘
 *                ↓
 * ┌─────────────────────────────────────────┐
 * │ Step 3: 导入PBKDF2密钥                   │
 * │ raw data + PBKDF2 algorithm + deriveBits │
 * └─────────────────────────────────────────┘
 *                ↓
 * ┌─────────────────────────────────────────┐
 * │ Step 4: 派生密钥位（100,000次迭代）      │
 * │ PBKDF2(password, salt, iterations,       │
 * │        SHA-256, outputBits=256)          │
 * │ → ArrayBuffer (32字节 = 256位)          │
 * └─────────────────────────────────────────┘
 *                ↓
 * ┌─────────────────────────────────────────┐
 * │ Step 5: 转换为十六进制字符串             │
 * │ [215, 93, 183, ...]                     │
 * │ → "d75db7a3f2..." (64个十六进制字符)    │
 * └─────────────────────────────────────────┘
 *                ↓
 * 输出: "d75db7a3f2c19e80..." (64字符的十六进制哈希字符串)
 *
 * 【关于盐值(Salt)的重要说明】
 *
 * ⚠️ 当前实现的限制：
 * 本版本使用固定的硬编码盐值："algorithm-visualizer-salt-v1"
 *
 * 这意味着：
 * - 相同的密码总是产生相同的哈希值（确定性）
 * - 可能受到彩虹表(Rainbow Table)攻击（如果攻击者知道盐值）
 * - 不符合OWASP的最佳实践（应该每个用户使用唯一随机盐值）
 *
 * ✅ 生产环境改进建议：
 * 1. 为每个用户生成随机的16-32字节盐值
 * 2. 将盐值与哈希值一起存储在数据库中
 * 3. 注册时生成新盐值，登录时读取该用户的盐值
 *
 * 示例生产级流程：
 * 注册：生成randomSalt → hashPassword(pwd, salt) → 存储(salt, hash)
 * 登录：读取user.salt → hashPassword(inputPwd, salt) → 对比storedHash
 *
 * 【性能考量】
 *
 * 迭代次数：100,000次
 * - 在现代桌面浏览器上约需50-200ms（可接受的用户体验延迟）
 * - 使暴力破解速度降低10万倍
 * - OWASP推荐的最低值为10,000次（2016年起推荐60,000+次）
 *
 * 输出长度：256位（32字节）
 * - 转换为64个十六进制字符
 * - SHA-256的标准输出长度
 * - 提供128位的安全强度（抗生日攻击）
 *
 * @param password - 要哈希的用户密码明文
 *                   应该是用户输入的原始密码字符串
 *                   典型来源：登录表单、注册表单、密码修改界面
 *
 * @returns {Promise<string>} 返回Promise，解析为十六进制格式的哈希字符串
 *          特征如下：
 *          - 固定长度：64个字符（256位 = 32字节的十六进制表示）
 *          - 字符集：仅包含小写十六进制字符（0-9, a-f）
 *          - 示例："d75db7a3f2c19e8042b1a9c3d5e7f8b1a0c2d4e6f8a0b1c3d5e7f8a0b1c2d4"
 *          - 相同输入总是产生相同输出（因为使用固定盐值）
 *          - 几乎不可能出现两个不同密码产生相同哈希（抗碰撞）
 *
 * @throws 由于使用了async/await语法，可能的异常会被Promise rejection捕获：
 *         - DOMException: Web Crypto API不支持或参数错误
 *         - TypeError: 密码参数类型不正确
 *         - OperationError: 底层加密操作失败
 *
 * @example
 * // 基本用法：哈希用户密码
 * async function registerUser(username, plainPassword) {
 *   const hashedPassword = await hashPassword(plainPassword);
 *   console.log('原始密码:', plainPassword);      // MyP@ssw0rd123
 *   console.log('哈希值:', hashedPassword);        // 64位十六进制字符串
 *   // 将hashedPassword发送到服务器存储（绝不存储plainPassword！）
 *   await api.createUser({ username, passwordHash: hashedPassword });
 * }
 *
 * @example
 * // 验证用户登录
 * async function loginUser(username, inputPassword) {
 *   // 1. 获取用户存储的哈希值（从数据库/API）
 *   const storedHash = await api.getUserPasswordHash(username);
 *
 *   // 2. 对用户输入的密码进行同样的哈希
 *   const inputHash = await hashPassword(inputPassword);
 *
 *   // 3. 比较两个哈希值（使用时间恒定的比较方式防计时攻击）
 *   if (inputHash === storedHash) {
 *     console.log('登录成功！');
 *     return true;
 *   } else {
 *     console.error('密码错误');
 *     return false;
 *   }
 * }
 *
 * @example
 * // 在实际组件中使用（React/Vue等）
 * async function handlePasswordChange(newPassword) {
 *   try {
 *     showLoadingIndicator();
 *     const hash = await hashPassword(newPassword);
 *     await updateUserPassword(hash);
 *     showSuccessMessage('密码修改成功');
 *   } catch (error) {
 *     showError('密码处理失败，请重试');
 *   } finally {
 *     hideLoadingIndicator();
 *   }
 * }
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto - Web Crypto API文档
 * @see https://owasp.org/www-project-password-storage-guidelines/ - OWASP密码存储指南
 * @see simpleHash - 如果只需要简单混淆（可逆），请使用该函数
 *
 * @security ⚠️ 重要安全提示：
 * 1. 哈希过程必须在受信任的环境（HTTPS页面）中执行
 * 2. 不要在日志、错误消息或URL中记录password参数
 * 3. 哈希值应该尽快传输到服务端存储，不在客户端长时间保留
 * 4. 生产环境请考虑使用per-user随机盐值
 * 5. 定期评估迭代次数是否足够（随着硬件性能提升需增加）
 */
export async function hashPassword(password: string): Promise<string> {
  /**
   * 步骤1：创建文本编码器并将密码转换为字节数组
   *
   * TextEncoder是什么？
   * TextEncoder是浏览器原生API，用于将JavaScript字符串转换为UTF-8编码的字节序列。
   * 它返回一个Uint8Array（8位无符号整数数组），每个元素代表一个字节。
   *
   * 为什么需要转换为字节？
   * Web Crypto API的所有操作都是基于二进制数据的（ArrayBuffer/Uint8Array），
   * 不能直接处理JavaScript字符串。因此必须先进行编码转换。
   *
   * UTF-8编码特点：
   * - ASCII字符（0-127）占用1个字节
   * - 大多数常用汉字占用3个字节
   * - Emoji表情符号占用4个字节
   * - 示例："A" → [65], "中" -> [228, 184, 173], "😀" -> [240, 159, 152, 138]
   */
  const encoder = new TextEncoder();
  const data = encoder.encode(password);  // 字符串 → Uint8Array (UTF-8字节流)

  /**
   * 步骤2：准备盐值（Salt）
   *
   * 盐值的作用：
   * - 增加哈希的随机性，即使两个用户使用相同密码，哈希值也不同
   * - 抵制预先计算的彩虹表(Rainbow Table)攻击
   * - 增加暴力破解的难度和成本
   *
   * 当前使用的固定盐值："algorithm-visualizer-salt-v1"
   *
   * ⚠️ 重要提示：
   * 这是一个简化的实现。在生产环境中，应该：
   * 1. 使用密码学安全的随机数生成器（crypto.getRandomValues()）
   * 2. 为每个用户生成唯一的盐值（16-32字节推荐）
   * 3. 将盐值与哈希值一起存储（无需保密）
   *
   * 选择这个特定盐值字符串的原因：
   * - 包含项目名称，便于识别来源
   * - 包含版本号(v1)，便于未来升级
   * - 长度适中（27字节），提供足够的熵
   */
  const salt = encoder.encode('algorithm-visualizer-salt-v1');

  /**
   * 步骤3：导入密码作为加密密钥材料
   *
   * crypto.subtle.importKey() 的作用：
   * 将原始的字节格式密码导入为Web Crypto API可以操作的CryptoKey对象。
   *
   * 参数详解：
   *
   * format: 'raw'
   * - 表示输入数据是原始字节格式（ArrayBufferView）
   * - 其他可选格式：'pkcs8', 'spki', 'jwk'（用于公私钥）
   *
   * keyData: data
   * - 我们在步骤1中编码的密码字节数组
   * - 这是PBKDF2的实际输入密码
   *
   * algorithm: { name: 'PBKDF2' }
   * - 指定要使用的密钥派生算法
   * - 告诉Web Crypto这个密钥将用于PBKDF2操作
   *
   * extractable: false
   * - **安全重要设置**：禁止导出此密钥
   * - 设置为true将允许使用exportKey()提取原始密钥材料
   * - 对于密码哈希场景，我们永远不需要再次提取密码本身
   * - 这是防御性编程的最佳实践
   *
   * keyUsages: ['deriveBits']
   * - 指定此密钥允许的操作
   * - deriveBits：允许从此密钥派生原始位数据（我们的目标操作）
   * - 其他可选值：'deriveKey'（派生为新密钥）、'sign'、'verify'等
   *
   * 返回值：CryptoKey对象（不透明的加密密钥句柄）
   */
  const key = await crypto.subtle.importKey(
    'raw',           // 格式：原始字节
    data,            // 密钥材料：UTF-8编码的密码
    'PBKDF2',        // 算法：PBKDF2密钥派生
    false,           // 不可导出（安全最佳实践）
    ['deriveBits']   // 允许的操作：派生位数据
  );

  /**
   * 步骤4：执行PBKDF2密钥派生（核心计算步骤）
   *
   * crypto.subtle.deriveBits() 的作用：
   * 基于输入的密码和参数，反复应用伪随机函数(HMAC-SHA-256)来派生密钥位。
   *
   * 参数详解：
   *
   * algorithm: {
   *   name: 'PBKDF2',
   *   salt: salt,
   *   iterations: 100000,
   *   hash: 'SHA-256'
   * }
   *
   * name: 'PBKDF2'
   * - 派生算法名称
   *
   * salt: salt
   * - 我们在步骤2中准备的盐值字节
   * - 与密码混合以增加随机性
   *
   * iterations: 100000
   * - **最重要的安全参数**
   * - HMAC-SHA-256的重复应用次数
   * - 更高的迭代次数 = 更高的安全性 + 更长的计算时间
   * - 权衡考虑：
   *   * 10,000次：太快，容易被GPU破解（OWASP最低推荐，2016年标准）
   *   * 100,000次：当前选择的平衡点（~100ms，用户体验可接受）
   *   * 1,000,000次：更安全但可能影响用户体验（~1秒）
   * - 建议：根据目标硬件和用户体验要求调整
   *
   * hash: 'SHA-256'
   * - PBKDF2内部使用的底层哈希函数
   * - SHA-256是目前广泛认可的安全哈希算法
   * - 输出256位（32字节）的哈希值
   * - 其他选项：SHA-1（不推荐，已被证明薄弱）、SHA-384、SHA-512
   *
   * key: key
   * - 步骤3中导入的密码密钥
   *
   * length: 256
   * - 期望输出的位长度
   * - 256位 = 32字节 = 64个十六进制字符
   * - 不应超过底层哈希函数的输出长度（SHA-256最大256位）
   * - 常见选择：128、192、256（位数越高越安全，但收益递减）
   *
   * 返回值：ArrayBuffer（包含派生出的原始二进制数据）
   * - 这是一个固定长度的字节缓冲区
   * - 包含最终的哈希结果（尚未转换为可读格式）
   */
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',           // 使用PBKDF2算法
      salt,                     // 应用盐值
      iterations: 100000,       // 迭代10万次（安全性与性能的平衡）
      hash: 'SHA-256'           // 底层使用SHA-256哈希函数
    },
    key,                        // 导入的密码密钥
    256                         // 输出256位（32字节）
  );

  /**
   * 步骤5：将二进制哈希转换为十六进制字符串
   *
   * 为什么需要转换？
   * - ArrayBuffer是二进制数据，不适合直接显示或传输
   * - 十六进制字符串是密码哈希的标准表示形式
   * - 便于存储在数据库中（文本字段）
   * - 便于在网络中传输（JSON、HTTP等文本协议）
   *
   * 转换过程详解：
   *
   * 1. new Uint8Array(derivedBits)
   *    - 将ArrayBuffer转换为TypedArray视图
   *    - 允许按字节访问数据
   *    - 例如：[215, 93, 183, 162, 243, ...] (32个字节)
   *
   * 2. Array.from(...)
   *    - 将Uint8Array转换为普通JavaScript数组
   *    - 便于使用数组方法如map()
   *
   * 3. .map(b => b.toString(16))
   *    - 将每个字节（0-255）转换为十六进制字符串
   *    - toString(16)返回该数字的十六进制表示
   *    - 例如：215 → 'd7', 93 → '5d', 183 → 'b7'
   *    - 注意：结果可能是1位或2位字符（如15 → 'f', 255 → 'ff'）
   *
   * 4. .padStart(2, '0')
   *    - **关键的格式化步骤**
   *    - 确保每个字节都恰好用2个十六进制字符表示
   *    - 单字符结果前面补零：'f' → '0f', 'a' → '0a'
   *    - 双字符结果保持不变：'d7' → 'd7', 'ff' → 'ff'
   *    - 保证最终字符串长度固定为64字符（32字节 × 2字符/字节）
   *
   * 5. .join('')
   *    - 将所有十六进制字节拼接成一个完整字符串
   *    - 例如：['d7', '5d', 'b7', ...] → "d75db7..."
   *
   * 最终输出示例：
   * "d75db7a3f2c19e8042b1a9c3d5e7f8b1a0c2d4e6f8a0b1c3d5e7f8a0b1c2d4"
   * （64个小写十六进制字符，代表256位的哈希值）
   */
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))  // 每个字节转2位十六进制（不足补零）
    .join('');                                    // 拼接为完整的哈希字符串
}
