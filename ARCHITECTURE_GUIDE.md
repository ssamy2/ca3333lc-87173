# Nova Gifts Price Checker - Architecture Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Services & APIs](#services--apis)
7. [State Management](#state-management)
8. [Styling System](#styling-system)
9. [Backend Architecture](#backend-architecture)
10. [Deployment](#deployment)

---

## Project Overview

Nova Gifts Price Checker is a Telegram Web App built with React and TypeScript that allows users to:
- Search for NFT gifts by account or individual gift
- View market data with interactive visualizations
- Generate and share heatmaps of gift collections
- Track floor prices and market trends

---

## Technology Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations

### UI Components
- **shadcn/ui** - Accessible component library built on Radix UI
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Data Visualization
- **Chart.js** - Charting library
- **React-Chartjs-2** - React wrapper for Chart.js
- **chartjs-chart-treemap** - Treemap plugin
- **Recharts** - Alternative charting solution

### State & Data Fetching
- **TanStack Query (React Query)** - Server state management
- **React Router DOM** - Client-side routing
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Database
- **Supabase** - Backend-as-a-Service (via Lovable Cloud)
- **Deno** - Edge Functions runtime

### Image Processing
- **html2canvas** - DOM to canvas rendering for screenshots

---

## Project Structure

```
nova-gifts-price-checker/
├── public/                      # Static assets
│   └── robots.txt
├── src/
│   ├── assets/                  # Images and static files
│   │   ├── nova-logo-new.png
│   │   ├── ton-icon.png
│   │   └── ...
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── AppLoader.tsx
│   │   ├── BottomNav.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── MarketTable.tsx
│   │   ├── NFTCard.tsx
│   │   ├── TelegramApp.tsx
│   │   ├── TreemapHeatmap.tsx
│   │   └── ...
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useMarketData.ts
│   │   ├── useBlackFloorData.ts
│   │   ├── useTheme.ts
│   │   └── ...
│   ├── integrations/            # External service integrations
│   │   └── supabase/
│   │       ├── client.ts        # Auto-generated Supabase client
│   │       └── types.ts         # Auto-generated DB types
│   ├── lib/                     # Utility libraries
│   │   ├── imageProxy.ts
│   │   ├── telegramAuth.ts
│   │   └── utils.ts
│   ├── pages/                   # Route pages
│   │   ├── Index.tsx
│   │   ├── Chart.tsx
│   │   ├── GiftDetail.tsx
│   │   ├── ProfileSettingsPage.tsx
│   │   └── NotFound.tsx
│   ├── services/                # API and data services
│   │   ├── apiService.ts
│   │   ├── imageCache.ts
│   │   ├── marketCache.ts
│   │   └── mockData.ts
│   ├── types/                   # TypeScript type definitions
│   │   └── telegram.d.ts
│   ├── utils/                   # Helper utilities
│   │   └── heatmapImageSender.ts
│   ├── i18n/                    # Internationalization
│   │   └── translations.ts
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles & design tokens
├── supabase/                    # Backend configuration
│   ├── functions/               # Edge Functions
│   │   ├── api-proxy/
│   │   ├── secure-proxy/
│   │   ├── send-image/
│   │   └── telegram-auth/
│   └── config.toml              # Supabase configuration
├── tailwind.config.ts           # Tailwind configuration
├── vite.config.ts               # Vite configuration
└── package.json                 # Dependencies
```

---

## Core Components

### 1. TelegramApp.tsx
**Purpose**: Main application component for the home page

**Responsibilities**:
- User account search functionality
- NFT gift display
- Integration with Telegram WebApp API
- Handling search modes (single gift vs. full account)
- Navigation to detail views

**Key Features**:
- Debounced search input
- Loading states
- Error handling
- Empty state display
- Telegram theme integration

### 2. TreemapHeatmap.tsx
**Purpose**: Interactive treemap visualization of gift market data

**Responsibilities**:
- Rendering treemap chart using Chart.js
- Color-coding based on price changes
- Screenshot generation using html2canvas
- Image sharing via Telegram

**Data Flow**:
```
Market Data → Chart.js Treemap → Canvas → html2canvas → Image → Telegram Share
```

### 3. MarketTable.tsx
**Purpose**: Tabular display of market data

**Responsibilities**:
- Sorting and filtering market data
- Responsive table layout
- Price change indicators
- Navigation to gift details

**Features**:
- Click-to-sort headers
- Price change percentages
- Floor price display
- Gift name and ID links

### 4. NFTCard.tsx
**Purpose**: Individual gift card component

**Responsibilities**:
- Display gift image and metadata
- Show price and change information
- Handle image loading states
- Responsive layout

### 5. BottomNav.tsx
**Purpose**: Mobile-friendly bottom navigation

**Responsibilities**:
- Route navigation (Home, Chart)
- Active state indication
- Icon display

---

## Data Flow

### User Search Flow
```
1. User enters account/gift ID
   ↓
2. TelegramApp component captures input
   ↓
3. apiService.searchNFTs() called
   ↓
4. API request to http://151.241.228.83:8001/get_nfts
   ↓
5. Response cached in marketCache
   ↓
6. NFTCard components rendered with data
```

### Market Data Flow
```
1. useMarketData hook initialized
   ↓
2. Fetches from apiService.getMarketData()
   ↓
3. Data cached in marketCache (30s TTL)
   ↓
4. Chart.tsx page consumes data
   ↓
5. TreemapHeatmap & MarketTable render visualizations
   ↓
6. Auto-refresh every 30 seconds
```

### Screenshot Sharing Flow
```
1. User clicks "Send Image" in TreemapHeatmap
   ↓
2. html2canvas captures chart area
   ↓
3. Canvas converted to base64 image
   ↓
4. Image sent to send-image edge function
   ↓
5. Edge function verifies Telegram WebApp data
   ↓
6. Image forwarded to backend API
   ↓
7. User receives image in Telegram
```

---

## Services & APIs

### apiService.ts
Central service for all API communications

**Methods**:

```typescript
// Search for NFTs by account or gift
searchNFTs(search: string): Promise<NFTData>

// Get single gift price data
getSingleGift(giftId: string): Promise<NFTGift>

// Get market overview data
getMarketData(): Promise<NFTMarketData[]>

// Get user profile information
getUserProfile(userId: string): Promise<any>

// Send image via Telegram
sendImage(imageData: string, initData: string): Promise<any>
```

**Base URLs**:
- Main API: `http://151.241.228.83:8001`
- Image API: `http://151.241.228.83/api`

### marketCache.ts
Client-side caching layer for market data

**Features**:
- localStorage-based persistence
- TTL (Time To Live) support
- Automatic cache invalidation
- JSON serialization/deserialization

**Usage**:
```typescript
// Set cache with 30-second TTL
marketCache.set('market_data', data, 30);

// Get cached data
const cached = marketCache.get('market_data');

// Check if cache is valid
if (!marketCache.isExpired('market_data')) {
  // Use cached data
}
```

### imageCache.ts
Temporary image storage service

**Purpose**: Store generated screenshots before sending

---

## State Management

### React Query (TanStack Query)
Used for server state management and caching

**Configuration** (in App.tsx):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
    },
  },
});
```

### Context API

#### AuthContext
- Manages user authentication state
- Telegram user data
- Session management

#### LanguageContext
- Manages app language (EN/RU/AR)
- Translation functions
- Locale persistence

### Local State
Components use React hooks for local state:
- `useState` - Component state
- `useEffect` - Side effects
- `useCallback` - Memoized callbacks
- `useMemo` - Memoized values

---

## Styling System

### Design Tokens (index.css)
All colors and design values are defined as CSS custom properties:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --secondary-transparent: 220 15% 93%;
  --accent: 210 40% 96.1%;
  /* ... more tokens */
}
```

### Tailwind Configuration
Extended in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      // ... more colors mapped to CSS variables
    },
  },
}
```

### Component Variants (CVA)
Using `class-variance-authority` for component variants:

```typescript
// button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground...",
        destructive: "bg-destructive text-destructive-foreground...",
        outline: "border border-input bg-background...",
        // ... more variants
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        // ... more sizes
      },
    },
  }
);
```

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`
- Bottom navigation for mobile
- Responsive tables and cards

---

## Backend Architecture

### Lovable Cloud (Supabase)
The app uses Lovable Cloud, which is powered by Supabase.

**Project Details**:
- Project ID: `ymgqsiwwlcpbuxbjkslc`
- URL: Auto-configured via `.env`
- Anon Key: Auto-configured via `.env`

### Edge Functions

#### 1. api-proxy
**Purpose**: Simple proxy for API requests

**Location**: `supabase/functions/api-proxy/index.ts`

**Flow**:
```
Client → Edge Function → Backend API → Edge Function → Client
```

**Features**:
- CORS handling
- Request forwarding
- Response passthrough
- Image and JSON support

#### 2. secure-proxy
**Purpose**: Authenticated API proxy with token validation

**Location**: `supabase/functions/secure-proxy/index.ts`

**Flow**:
```
Client (with token) → Verify token in DB → Forward request → Decrement operations → Return response
```

**Features**:
- Token validation
- Operation counting
- Token expiration checking
- Automatic token cleanup

#### 3. send-image
**Purpose**: Telegram image upload handler

**Location**: `supabase/functions/send-image/index.ts`

**Flow**:
```
Client → Verify Telegram WebApp data → Validate image → Forward to backend API
```

**Security**:
- HMAC-SHA256 verification
- Telegram bot token validation
- Image format validation (JPEG, PNG, WebP)
- Size limit enforcement (10MB)

#### 4. telegram-auth
**Purpose**: Telegram user authentication

**Location**: `supabase/functions/telegram-auth/index.ts`

**Flow**:
```
Client → Send initData → Verify HMAC → Generate token → Store in DB → Return token
```

**Features**:
- Telegram WebApp data verification
- Secure token generation
- Database token storage
- Operation limit initialization

---

## Custom Hooks

### useMarketData.ts
**Purpose**: Fetch and cache market data

**Features**:
- Auto-refresh every 30 seconds
- Cache management
- Error handling
- Loading states

**Usage**:
```typescript
const { data, isLoading, error } = useMarketData();
```

### useBlackFloorData.ts
**Purpose**: Fetch Black Floor price data

**Features**:
- 1-minute refresh interval
- Separate caching from market data
- Background updates

### useTheme.ts
**Purpose**: Manage light/dark theme

**Features**:
- System preference detection
- Manual theme toggle
- Persistence in localStorage
- Telegram theme integration

### useDataPrefetch.ts
**Purpose**: Prefetch data for performance

**Features**:
- Background data loading
- Route-based prefetching
- Cache warming

---

## TypeScript Types

### NFTGift
```typescript
interface NFTGift {
  gift_id: string;
  name: string;
  image: string;
  total_supply: number;
  price?: number;
  floor_price?: number;
  change_24h?: number;
  owner_count?: number;
  // ... more fields
}
```

### NFTData
```typescript
interface NFTData {
  user_id?: string;
  name?: string;
  gifts: NFTGift[];
}
```

### NFTMarketData
```typescript
interface NFTMarketData {
  gift_id: string;
  name: string;
  floor_price: number;
  change_24h: number;
  volume_24h?: number;
  // ... more fields
}
```

---

## Deployment

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Lovable Deployment
- Automatic deployment via Lovable platform
- Frontend: Click "Update" in publish dialog
- Backend: Edge functions deploy automatically
- Custom domain support available

---

## Performance Optimizations

### Caching Strategy
1. **Market Data**: 30-second cache
2. **Black Floor Prices**: 1-minute cache
3. **Images**: Service worker cache (if implemented)
4. **API Responses**: localStorage persistence

### Code Splitting
- Route-based code splitting via React Router
- Lazy loading of heavy components
- Dynamic imports for dialogs and modals

### Image Optimization
- Lazy loading images in NFTCard
- Responsive image sizes
- Fallback images for errors
- Image proxy for external sources

---

## Error Handling

### Global Error Boundary
```typescript
// ErrorBoundary.tsx
<ErrorBoundary fallback={<ErrorState />}>
  <App />
</ErrorBoundary>
```

### API Error Handling
```typescript
try {
  const data = await apiService.getMarketData();
} catch (error) {
  console.error('Failed to fetch market data:', error);
  toast.error('Failed to load market data');
}
```

### Loading States
- Skeleton loaders
- Spinner components
- Progress indicators
- Empty state placeholders

---

## Security Considerations

### Telegram WebApp Verification
- HMAC-SHA256 signature verification
- Bot token validation
- Data integrity checks

### Environment Variables
- Never commit `.env` files
- Use Vite environment variables (`import.meta.env`)
- Secure token storage

### CORS Configuration
- Proper CORS headers in edge functions
- Whitelist specific origins in production

---

## Future Enhancements

### Potential Features
1. Real-time price updates via WebSocket
2. User portfolios and watchlists
3. Price alerts and notifications
4. Advanced filtering and search
5. Historical price charts
6. Rarity calculations
7. Social features (sharing, comments)

### Performance Improvements
1. Service worker for offline support
2. Virtual scrolling for large lists
3. Image CDN integration
4. GraphQL for efficient data fetching

---

## Troubleshooting

### Common Issues

**Issue**: Market data not loading
- Check API endpoint availability
- Verify cache expiration
- Check browser console for errors

**Issue**: Images not displaying
- Verify image URLs
- Check CORS configuration
- Test image proxy functionality

**Issue**: Telegram features not working
- Ensure app is running in Telegram WebApp
- Verify initData is being passed correctly
- Check bot token configuration

---

## Contributing

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Format code with Prettier
- Write meaningful commit messages

### Component Guidelines
- Keep components small and focused
- Use TypeScript interfaces for props
- Implement error boundaries
- Add loading and error states

### Testing (Future)
- Unit tests for utilities
- Integration tests for API services
- E2E tests for critical flows
- Component tests with React Testing Library

---

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Telegram WebApp API](https://core.telegram.org/bots/webapps)
- [Chart.js Documentation](https://www.chartjs.org/)

---

**Last Updated**: 2025-11-13
**Version**: 1.0.0
