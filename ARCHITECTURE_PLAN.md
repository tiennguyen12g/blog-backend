# Blog Project Architecture Plan

## Overview
This document outlines the architecture, database schemas, and feature recommendations for the Australia blog project with personal finance management.

---

## 1. User Management & Authentication

### User Schema Enhancements
Based on `english-learner-backend`, but adapted for blog needs:

```typescript
User {
  // Authentication
  email: string (unique, required)
  password: string (hashed, required)
  role: 'user' | 'manager' | 'admin' (default: 'user')
  
  // Profile Information
  profile: {
    firstName?: string
    lastName?: string
    avatar?: string
    bio?: string
    phoneNumber?: string
    sex?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
    dateOfBirth?: Date
    address?: {
      street?: string
      city?: string
      state?: string
      postalCode?: string
      country?: string (default: 'Australia')
    }
    location?: string // Current location in Australia
    interests?: string[]
    socialLinks?: {
      facebook?: string
      instagram?: string
      linkedin?: string
      twitter?: string
    }
  }
  
  // Security
  secure?: {
    google2FA?: {
      twoFactorSecret?: string
      otpauth_url?: string
      is2FAVerified?: boolean
    }
  }
  
  // Status
  isActive?: boolean (default: true)
  lastLoginAt?: Date
  createdAt?: Date
  updatedAt?: Date
}
```

### Role-Based Access Control
- **User**: Can read articles, manage own finance records, update own profile
- **Manager**: Can create/edit articles, manage own finance records
- **Admin**: Full access (create/edit/delete articles, manage users, system config)

---

## 2. Article Management

### Article Schema (Similar to english-learner-backend)
```typescript
Article {
  title: string (required)
  content: string (HTML from Quill editor, required)
  excerpt?: string (short summary for preview)
  authorId: string (reference to User, required)
  status: 'draft' | 'published' | 'archived' (default: 'draft')
  
  // Categorization
  tags?: string[]
  categories?: string[] // e.g., ['Work Experience', 'Travel', 'Food', 'Tips']
  
  // Media
  coverImage?: string (URL)
  images?: string[] (array of image URLs)
  
  // Engagement
  viewCount?: number (default: 0)
  likeCount?: number (default: 0)
  
  // Metadata
  isFeatured?: boolean (default: false)
  publishedAt?: Date
  isPublic?: boolean (default: true)
  metadata?: {
    seoTitle?: string
    seoDescription?: string
    readingTime?: number (minutes)
  }
  
  // Timestamps
  createdAt?: Date
  updatedAt?: Date
}
```

### Article Categories (Suggested)
- Work Experience (Farm, Uber, Casual, Part-time)
- Living in Australia (Rent, Bills, Transportation)
- Food & Dining
- Travel & Exploration
- Tips & Guides
- Personal Stories
- Finance Tips

---

## 3. Finance Management System

### Account Types Schema
```typescript
Account {
  userId: string (reference to User, required)
  name: string (required) // e.g., "Main Bank Account", "Cash Wallet"
  type: 'cash' | 'bank_account' | 'crypto_wallet' (required)
  balance: number (default: 0) // Current balance in AUD
  currency: string (default: 'AUD')
  description?: string
  isActive?: boolean (default: true)
  createdAt?: Date
  updatedAt?: Date
}
```

### Transaction Schema
```typescript
Transaction {
  userId: string (reference to User, required)
  accountId: string (reference to Account, required)
  
  // Transaction Details
  type: 'income' | 'expense' (required)
  amount: number (required, positive number)
  currency: string (default: 'AUD')
  date: Date (required, default: now)
  
  // Income Categories
  incomeCategory?: 
    'farm_job' | 
    'uber' | 
    'casual_job' | 
    'parttime_job' | 
    'fulltime_job' |
    'stock' | 
    'crypto' | 
    'freelance' |
    'other_income'
  
  // Expense Categories
  expenseCategory?: 
    'rent' | 
    'food' | 
    'car' | 
    'transportation' | 
    'medical_care' | 
    'education' | 
    'electric_bill' | 
    'water_bill' | 
    'internet_bill' | 
    'phone_bill' |
    'insurance' |
    'entertainment' |
    'shopping' |
    'other_expense'
  
  // Details
  description?: string
  note?: string
  location?: string // Where the transaction occurred
  tags?: string[]
  
  // Receipt/Proof
  receiptImage?: string (URL to uploaded receipt)
  attachments?: string[] (array of file URLs)
  
  // Recurring Transactions
  isRecurring?: boolean (default: false)
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    endDate?: Date
    nextDueDate?: Date
  }
  
  // Timestamps
  createdAt?: Date
  updatedAt?: Date
}
```

### Budget Schema (Optional - Future Enhancement)
```typescript
Budget {
  userId: string (reference to User, required)
  category: string (matches expenseCategory)
  amount: number (budget limit)
  period: 'weekly' | 'monthly' | 'yearly'
  startDate: Date
  endDate?: Date
  isActive?: boolean (default: true)
  createdAt?: Date
  updatedAt?: Date
}
```

---

## 4. Dashboard & Analytics

### Dashboard Data Structure
```typescript
DashboardData {
  // Summary Cards
  totalBalance: number // Sum of all account balances
  totalIncome: number // Sum of income transactions in period
  totalExpense: number // Sum of expense transactions in period
  netSavings: number // totalIncome - totalExpense
  
  // Account Breakdown
  accounts: {
    cash: number
    bankAccount: number
    cryptoWallet: number
  }
  
  // Category Breakdown (for charts)
  incomeByCategory: {
    category: string
    amount: number
    percentage: number
  }[]
  
  expenseByCategory: {
    category: string
    amount: number
    percentage: number
  }[]
  
  // Time-based Data
  monthlyData: {
    month: string
    income: number
    expense: number
    savings: number
  }[]
  
  // Recent Transactions
  recentTransactions: Transaction[]
}
```

---

## 5. System Configuration

### System Config Schema (Similar to english-learner pattern)
```typescript
SystemConfig {
  key: string (unique, required)
  value: any (required)
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  category?: string // e.g., 'general', 'finance', 'blog'
  isPublic?: boolean (default: false)
  updatedBy?: string (reference to User)
  createdAt?: Date
  updatedAt?: Date
}
```

### Suggested Config Keys
- `site.name`: Blog name
- `site.description`: Site description
- `finance.default_currency`: Default currency (AUD)
- `finance.income_categories`: Available income categories
- `finance.expense_categories`: Available expense categories
- `blog.categories`: Available blog categories
- `blog.tags`: Popular tags

---

## 6. Additional Features & Recommendations

### A. Memory/Photo Gallery
```typescript
Memory {
  userId: string (reference to User, required)
  title: string (required)
  description?: string
  images: string[] (array of image URLs)
  location?: string
  date: Date (required)
  tags?: string[]
  isPublic?: boolean (default: false)
  createdAt?: Date
  updatedAt?: Date
}
```

### B. Comments System (Future)
```typescript
Comment {
  articleId: string (reference to Article)
  userId: string (reference to User)
  content: string (required)
  parentId?: string (reference to Comment, for replies)
  isApproved?: boolean (default: true)
  createdAt?: Date
  updatedAt?: Date
}
```

### C. Search & Filtering
- Full-text search for articles (title, content, tags)
- Filter articles by category, tags, date range
- Filter transactions by category, date range, account
- Search memories by title, location, date

### D. Export/Import Features
- Export finance data to CSV/Excel
- Export articles to Markdown/PDF
- Import transactions from bank statements (CSV)

### E. Notifications (Future)
- Budget alerts (when approaching limit)
- Recurring transaction reminders
- Article comment notifications

### F. Reports & Insights
- Monthly/Yearly financial reports
- Spending trends analysis
- Income vs Expense comparison charts
- Category-wise spending analysis
- Savings goals tracking

---

## 7. API Endpoints Structure

### User Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh-token` - Refresh token
- `GET /api/v1/users/profile` - Get own profile
- `PUT /api/v1/users/profile` - Update own profile
- `PUT /api/v1/users/password` - Change password

### Article Endpoints
- `GET /api/v1/articles` - List articles (public, with filters)
- `GET /api/v1/articles/:id` - Get article by ID
- `POST /api/v1/articles` - Create article (manager/admin only)
- `PUT /api/v1/articles/:id` - Update article (author/manager/admin)
- `DELETE /api/v1/articles/:id` - Delete article (author/admin)
- `POST /api/v1/articles/:id/like` - Like article

### Finance Endpoints
- `GET /api/v1/accounts` - Get user's accounts
- `POST /api/v1/accounts` - Create account
- `PUT /api/v1/accounts/:id` - Update account
- `DELETE /api/v1/accounts/:id` - Delete account

- `GET /api/v1/transactions` - Get transactions (with filters)
- `POST /api/v1/transactions` - Create transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

- `GET /api/v1/finance/dashboard` - Get dashboard data
- `GET /api/v1/finance/reports` - Get financial reports
- `GET /api/v1/finance/export` - Export data to CSV

### Memory Endpoints
- `GET /api/v1/memories` - Get memories
- `POST /api/v1/memories` - Create memory
- `PUT /api/v1/memories/:id` - Update memory
- `DELETE /api/v1/memories/:id` - Delete memory

### System Config Endpoints (Admin only)
- `GET /api/v1/config` - Get configs
- `GET /api/v1/config/:key` - Get config by key
- `PUT /api/v1/config/:key` - Update config

---

## 8. Frontend Structure Recommendations

### Pages
- `/` - Home (article list)
- `/articles/:id` - Article detail
- `/articles/new` - Create article (manager/admin)
- `/articles/edit/:id` - Edit article (author/manager/admin)
- `/profile` - User profile page
- `/profile/settings` - Profile settings
- `/finance` - Finance dashboard
- `/finance/transactions` - Transaction list
- `/finance/transactions/new` - Add transaction
- `/finance/accounts` - Account management
- `/finance/reports` - Financial reports
- `/memories` - Memory gallery
- `/memories/new` - Add memory

### Components
- ArticleCard, ArticleList, ArticleEditor
- TransactionForm, TransactionList, TransactionCard
- AccountCard, AccountForm
- DashboardSummary, CategoryChart, MonthlyChart
- MemoryCard, MemoryGallery, MemoryForm

---

## 9. Database Indexes

### User Collection
- `email` (unique)
- `role`

### Article Collection
- `authorId`
- `status`
- `tags`
- `categories`
- `createdAt` (descending)
- `publishedAt` (descending)
- `title` (text search)

### Transaction Collection
- `userId`
- `accountId`
- `type`
- `date` (descending)
- `incomeCategory`
- `expenseCategory`
- `userId + date` (compound)

### Account Collection
- `userId`
- `type`

---

## 10. Security Considerations

1. **Password Hashing**: Use bcrypt (already in english-learner)
2. **JWT Tokens**: Access token + Refresh token (cookie-based)
3. **Input Validation**: Zod schemas for all inputs
4. **File Uploads**: Validate file types, size limits, scan for malware
5. **Rate Limiting**: Prevent abuse on public endpoints
6. **CORS**: Configure properly for frontend domain
7. **Data Privacy**: Users can only access their own finance data

---

## 11. Technology Stack

### Backend (NestJS)
- Framework: NestJS (already in use)
- Database: MongoDB with Mongoose
- Authentication: Passport.js + JWT
- Validation: Zod
- File Upload: Multer

### Frontend (React)
- Framework: React + TypeScript
- State Management: Zustand (already in use)
- Data Fetching: TanStack Query (already in use)
- UI Library: Based on existing setup
- Charts: Recharts or Chart.js for finance visualizations
- Rich Text Editor: Quill (for articles)

---

## 12. Implementation Priority

### Phase 1: Core Features
1. User authentication & authorization
2. User profile management
3. Article CRUD (basic)
4. Basic finance: Accounts & Transactions
5. Finance dashboard (basic charts)

### Phase 2: Enhanced Features
1. Article categories, tags, search
2. Finance reports & analytics
3. Memory/Photo gallery
4. Export functionality

### Phase 3: Advanced Features
1. Budget management
2. Recurring transactions
3. Comments system
4. Notifications
5. Advanced analytics

---

## 13. Questions to Consider

1. **Multi-currency support?** Currently AUD-focused, but might need others
2. **Multi-user finance sharing?** Share accounts with family/partner?
3. **Receipt OCR?** Auto-extract transaction data from receipt images?
4. **Bank integration?** Connect to Australian banks via Open Banking API?
5. **Mobile app?** React Native version in future?
6. **Backup & Export?** Regular data backups, user data export (GDPR compliance)

---

## Next Steps

1. Review and approve this architecture plan
2. Start implementing Phase 1 features
3. Set up database schemas
4. Create API endpoints
5. Build frontend components
6. Test and iterate

---

**Note**: This plan is comprehensive but flexible. We can adjust based on your priorities and feedback.
