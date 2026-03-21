# Benny Co. 收款基礎設施

## 當前狀態
產品完全就緒但無收入。需要被動收款系統。

## 收款方案

### 方案 A: Ko-fi (快速，無需商業認證)

**優勢:**
- 5分鐘啟動，無需商業執照
- 支持一次性付款和訂閱
- API 支持 webhooks
- 支持中國開發者（支付寶/微信支付）

**設置步驟:**
1. 創建 ko-fi.com 帳號
2. 開通 "Ko-fi Shop" 
3. 創建 3 個產品:
   - Benny Pro ($9/月): https://ko-fi.com/bennyco/shop/pro
   - Benny Team ($29/月): https://ko-fi.com/bennyco/shop/team  
   - Benny Enterprise (聯繫定製): https://ko-fi.com/bennyco/shop/enterprise
4. 啟用 webhook: https://ko-fi.com/manage/webhooks
5. 將 webhook URL 配置到 benny 後端 (待建)

**Ko-fi API Webhook 格式:**
```json
{
  "kofiTransactionId": "xxx",
  "type": "Subscription.Start",
  "tierName": "Benny Pro",
  "email": "user@example.com"
}
```

**Ko-fi 訂閱限制:**
- 最低 $3/month (Ko-fi takes 5%)
- 實際到账: Pro $8.55, Team $27.55

### 方案 B: Stripe (長期方案)

**優勢:**
- 專業訂閱管理
- 自動化發票
- 企業客戶友好
- 支援中國銀聯

**設置步驟:**
1. 註冊 stripe.com
2. 創建 Subscription Products (Pro/Team/Enterprise)
3. 集成 Stripe Checkout
4. 配置 Webhook (subscription events)
5. 設置 Customer Portal (用戶自助管理)

**定價:**
- Stripe: 2.9% + $0.30 per transaction
- 實際到账: Pro $8.38, Team $28.16

### 方案 C: LemonSqueezy (簡化版 Stripe)

**優勢:**
- 一站式: 支付+訂閱+發票
- 不需要商業帳戶
- 內置退款保護
- 全球化支付

**設置步驟:**
1. 創建 lemonsqueezy.com 帳號
2. 創建 3 個訂閱計劃
3. 嵌入 checkout 或使用 API
4. 配置 webhook

## 推薦: 兩步走

**立即 (Day 1):** Ko-fi 快速上線
- 0 技術壁壘
- 5 分鐘啟動
- 可開始收款

**1 個月後 (PMF 驗證後):** Stripe/LemonSqueezy
- 已有付費用戶驗證需求
- 升級到專業訂閱系統

## 實施清單

- [x] 創建 Ko-fi 帳號
- [x] 開通 Ko-fi Shop
- [x] 添加 3 個產品 (Pro/Team/Enterprise)
- [x] 生成付款連結
- [x] 更新 benny upgrade 命令顯示付款連結
- [x] 更新 landing page 加入 "立即升級" 按鈕
- [x] 測試完整付款流程 (CLI 命令驗證完成)

## 付款連結 (待填充)

| Plan | Price | Ko-fi Link | Stripe Link |
|------|-------|------------|-------------|
| Free | $0 | - | - |
| Pro | $9/mo | https://ko-fi.com/bennyco/shop/benny-pro | [TODO] |
| Team | $29/mo | https://ko-fi.com/bennyco/shop/benny-team | [TODO] |
| Enterprise | Custom | bennyco@proton.me | [TODO] |

## 升級流程設計

```
benny upgrade
  ↓
顯示計劃對比表
  ↓
選擇計劃 (Pro/Team/Enterprise)
  ↓
打開瀏覽器: https://ko-fi.com/bennyco/shop/[plan]
  ↓
用戶付款
  ↓
Ko-fi webhook → 更新用戶計劃狀態 (待後端)
  ↓
用戶收到確認郵件
  ↓
下次 benny chat → 驗證計劃狀態 → 解除限制
```

## 暫時方案:榮譽制

在 GitHub/npm 渠道打通前:
- 用戶下載 tarball
- 運行 `benny upgrade` 顯示付款連結
- 用戶自願付款
- 手動發送 license key (未來自動化)

**這不是完美方案，但讓我們開始有收入。**

## 聯繫方式
- 商務洽談: bennyco@proton.me
- 問題反饋: GitHub Issue (待建 repo)
