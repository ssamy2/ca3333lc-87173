# Telegram Mini App Launch Parameters

## Overview
The app now supports Telegram Launch Parameters for deep linking and direct navigation.

## Supported Parameters

### 1. User Search (`user_`)
**Format**: `user_{username}`

**Example**:
```
https://t.me/YourBot?start=user_durov
```

**Behavior**:
- Automatically searches for the specified username
- Sets search mode to "User Profile"
- Displays user's NFT gifts after authentication

---

### 2. Gift Search (`gift_`)
**Format**: `gift_{nft_id}`

**Example**:
```
https://t.me/YourBot?start=gift_abc123
```

**Behavior**:
- Automatically searches for the specified gift
- Converts to full URL: `https://t.me/nft/abc123`
- Sets search mode to "Single Gift"
- Displays gift details after authentication

---

### 3. Admin Panel (`admin_panel_2024`)
**Format**: `admin_panel_2024`

**Example**:
```
https://t.me/YourBot?start=admin_panel_2024
```

**Behavior**:
- Navigates directly to `/admin` route
- Shows admin dashboard
- No authentication bypass (still requires valid token)

---

## How It Works

### 1. Parameter Detection
```typescript
const tg = window.Telegram?.WebApp;
const startParam = tg?.initDataUnsafe?.start_param;
```

### 2. Parameter Parsing
```typescript
if (startParam.startsWith('user_')) {
  const username = startParam.replace('user_', '');
  // Auto-search user
}
```

### 3. Auto-Execution
- Waits for authentication (`isAuthenticated`)
- Executes once (`autoSearchTriggered` flag)
- 500ms delay for smooth UX

---

## Implementation Details

### Files Modified:
1. **`src/hooks/useLaunchParams.ts`** - New hook for parsing params
2. **`src/types/telegram.d.ts`** - Added `start_param` type
3. **`src/components/TelegramApp.tsx`** - Auto-search logic
4. **`src/pages/AdminPanel.tsx`** - New admin dashboard page
5. **`src/App.tsx`** - Added `/admin` route

### Key Features:
- ✅ Waits for authentication before executing
- ✅ Only triggers once per session
- ✅ Smooth transitions with delays
- ✅ Comprehensive error handling
- ✅ Console logging for debugging

---

## Testing

### Local Testing:
Since `start_param` only works in Telegram context, test using:

```javascript
// In browser console (for testing only)
window.Telegram = {
  WebApp: {
    initDataUnsafe: {
      start_param: 'user_testuser'
    },
    ready: () => {},
    expand: () => {}
  }
};
```

### Production Testing:
1. Create bot command with parameter
2. Share link with parameter
3. Click link in Telegram
4. Verify auto-search behavior

---

## Examples

### Share User Profile:
```
Hey! Check out my NFT gifts:
https://t.me/YourBot?start=user_myusername
```

### Share Specific Gift:
```
Look at this rare gift!
https://t.me/YourBot?start=gift_xyz789
```

### Admin Access:
```
Admin panel:
https://t.me/YourBot?start=admin_panel_2024
```

---

## Security Notes

- ⚠️ Admin parameter is just a router - no auth bypass
- ⚠️ All API calls still require valid Telegram auth token
- ⚠️ Parameters are logged for debugging (remove in production if needed)
- ✅ No sensitive data in parameters
- ✅ Safe for public sharing

---

## Future Enhancements

Possible additions:
- Channel/Group search (`channel_{username}`)
- Direct chart view (`chart_{mode}`)
- Search with filters (`search_{query}_{filter}`)
- Multiple parameters support
