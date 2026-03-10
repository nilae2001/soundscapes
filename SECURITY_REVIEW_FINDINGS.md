# Security & Code Quality Review - Soundscapes Application

**Date:** March 9, 2026  
**App Type:** React 19 + TypeScript + Vite | Supabase Backend  
**Severity Levels:** CRITICAL | HIGH | MEDIUM | LOW

---

## EXECUTIVE SUMMARY

This application has **3-4 critical security issues** and **7+ code quality concerns** that should be addressed immediately before production deployment. The most severe issues involve exposed API keys and hardcoded service URLs in client-side code.

---

## 🔴 CRITICAL SEVERITY ISSUES

### 1. **EXPOSED SUPABASE PROJECT ID IN SOURCE CODE**

**Location:** [src/pages/CreateSoundscapePage.tsx](src/pages/CreateSoundscapePage.tsx#L195) (Lines 195, 234)  
**Severity:** CRITICAL  
**Issue:**

```typescript
// Line 195
const response = await fetch(
  "https://ezvmqabfyjwvnrwhsjeg.supabase.co/functions/v1/book-scout",
  // ...
);

// Line 234
fetch(
  "https://ezvmqabfyjwvnrwhsjeg.supabase.co/functions/v1/audio-scout",
  // ...
);
```

**Risk:**

- Supabase project ID `ezvmqabfyjwvnrwhsjeg` is hardcoded and visible in:
  - Source code (Git history)
  - Built JavaScript bundle
  - Network requests in browser DevTools
- Allows attackers to enumerate your Supabase functions
- Enables direct API endpoint attacks

**Fix Required:**

```typescript
// Use environment variable instead:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const functionUrl = `${SUPABASE_URL}/functions/v1/book-scout`;
```

**Priority:** Fix IMMEDIATELY before any deployment

---

### 2. **GOOGLE BOOKS API KEY IN VERSION CONTROL**

**Location:** [.env](.env) (Line 4)  
**Severity:** CRITICAL  
**Issue:**

```
VITE_BOOKS_API_KEY=AIzaSyDsvyfJrYZDc7qrEkEQ1LUfkgNvtKv1OP8
```

**Risk:**

- Google API key is exposed in the `.env` file
- While `.env` is in `.gitignore`, **if this was ever committed**, it's permanently in Git history
- This key can be used to make unauthorized API calls at YOUR account's expense
- Subject to quota abuse and billing attacks

**Verification Needed:**

```bash
# Check if accidentally committed to Git history:
git log --all -S "AIzaSyDsvyfJrYZDc7qrEkEQ1LUfkgNvtKv1OP8"
```

**Remediation Steps:**

1. ✅ **Verify** if key was committed: Run command above
2. 🔴 **If found in history:** Revoke immediately in Google Cloud Console
3. 🔴 **Regenerate** new API key in Google Cloud
4. 📋 **Set API key restrictions:**
   - Restrict to specific APIs (Books API only)
   - Restrict to Android/iOS apps only (if mobile) OR
   - Add HTTP referrer restrictions to domain only
   - NOT a public key for JavaScript

**Action:** Check Git history immediately and revoke if needed

---

### 3. **PEXELS API KEY IN ENVIRONMENT & CLIENT BUNDLE**

**Location:** [.env](.env) (Line 3) and [src/lib/pexels.ts](src/lib/pexels.ts#L1)  
**Severity:** CRITICAL (Context-Dependent)  
**Issue:**

```typescript
// pexels.ts - Line 4
const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY;

// Gets included in production bundle as:
const headers = {
  Authorization: pexelsKey,
  "Content-Type": "application/json",
};
```

**Risk:**

- Pexels API key is exposed in browser's JavaScript
- Anyone can extract from DevTools → Application → Sources
- Enables quota abuse (if Pexels has rate limiting per key)
- Third-party can use your key to exhaust limits

**Better Practice:**

- Pexels API calls should be proxied through YOUR backend
- Backend adds its own authentication, calls Pexels internally
- Client calls: `GET /api/photos/search?q=forest` (no API key exposed)
- Backend calls: Direct to Pexels with key (secure)

**Current Flow (❌ INSECURE):**

```
Browser → [API Key Visible] → Pexels API
```

**Recommended Flow (✅ SECURE):**

```
Browser → Your Backend (with auth) → Pexels API
```

**Action:** Create backend endpoint to proxy Pexels calls

---

### 4. **SUPABASE ANON KEY EXPOSURE**

**Location:** [.env](.env) (Line 2)  
**Severity:** CRITICAL (But Intended Design)  
**Issue:**

```
VITE_SUPABASE_ANON_KEY=sb_publishable_UOwAMjcFZ75RAsRzYd1tfA_jqhrpf-d
```

**Analysis:**

- Supabase **intentionally** makes the anon key public
- This is by design - row-level security (RLS) is supposed to protect data
- ⚠️ **BUT:** This assumes RLS policies are correctly configured

**Validation Required:**

- [ ] Verify ALL tables have RLS enabled
- [ ] Check that `profiles` only shows data for authenticated users
- [ ] Verify users can only modify their own `saved_sounds` records
- [ ] Ensure `soundscapes` doesn't allow bulk data extraction via filters

**Recommended Action:** Audit Supabase RLS policies immediately

---

## 🟠 HIGH SEVERITY ISSUES

### 5. **CONSOLE.ERROR STATEMENTS LOGGING RAW ERRORS**

**Locations:**

- [src/components/FeaturedSounds.tsx](src/components/FeaturedSounds.tsx#L37) - Line 37
- [src/pages/CreateSoundscapePage.tsx](src/pages/CreateSoundscapePage.tsx#L74) - Lines 74, 186, 206

**Issue:**

```typescript
// Line 37 - FeaturedSounds.tsx
console.error("Error fetching featured sounds:", error);

// Line 186 - CreateSoundscapePage.tsx
console.error("Book Scout failed:", err);

// Line 206 - CreateSoundscapePage.tsx
console.error("Pexels fetch failed: " + error);
```

**Risk:**

- Raw error objects expose:
  - Stack traces with file paths/line numbers
  - Database error details
  - API structure information
- Visible to anyone with browser DevTools
- Can leak sensitive information about backend structure

**Fix:**

```typescript
// Instead of:
console.error("Error fetching featured sounds:", error);

// Use:
console.error("Failed to load featured soundscapes"); // Only in dev
if (process.env.NODE_ENV === "development") {
  console.error("Debug:", error);
}
// In production, use proper error logging service (Sentry, etc.)
```

**Action:** Remove or conditionally log errors

---

### 6. **NO INPUT VALIDATION ON AUTH FORMS**

**Location:** [src/components/Auth.tsx](src/components/Auth.tsx#L20-L50)  
**Severity:** HIGH  
**Issue:**

```typescript
// No validation before submitting
const handleAuth = async (e: React.SyntheticEvent) => {
  e.preventDefault();
  setLoading(true);

  const { error } =
    type === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: "https://nilaerturk.com/soundscapes/",
          },
        });
```

**Risks:**

- Empty strings can be submitted
- No email format validation before submission
- No password strength requirements displayed
- No feedback on validation errors before API call
- Wastes API calls on invalid data

**Missing Validation:**

```typescript
// ✅ Should validate:
- Email format (RFC 5322 compliant)
- Password length (minimum 8+ chars)
- No empty fields
- Password complexity (uppercase, lowercase, number, special char)
```

**Fix:**

```typescript
// Add using Zod + Mantine Form (already in dependencies)
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Must include uppercase, lowercase, number",
    ),
});

const form = useForm({
  validate: zodResolver(schema),
  initialValues: { email: "", password: "" },
});
```

**Priority:** HIGH - Implement validation immediately

---

### 7. **NO RATE LIMITING ON API CALLS**

**Locations:** Multiple pages making unrestricted API calls

- [src/pages/CreateSoundscapePage.tsx](src/pages/CreateSoundscapePage.tsx#L210-L240) - Book/Track search
- [src/components/SearchBar.tsx](src/components/SearchBar.tsx#L25-L60) - Profile/Sound search

**Issue:**

```typescript
// No debounce limit check; can make unlimited requests
const handleChange = async (val: string) => {
  // ... fetches immediately without rate limiting
  const soundSearch = supabase
    .from("soundscapes")
    .select("id, title, image_url")
    .ilike("title", `%${val}%`)
    .limit(5);
};
```

**Risk:**

- Malicious users can DOS your database
- Supabase bill increases unexpectedly
- Pexels quota depleted quickly
- No protection against automated attacks

**Better Implementation (Already using debounce):**

- ✅ CreateSoundscapePage uses `setTimeout` with 800-1000ms debounce (good!)
- ❌ SearchBar doesn't show debounce implementation
- ⚠️ Still lacks request throttling after debounce

**Additional Protection Needed:**

```typescript
// Add MAX_REQUESTS_PER_MINUTE check
const getOrCreateRateLimiter = () => {
  const requests: number[] = [];
  return {
    isAllowed: () => {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      const validRequests = requests.filter((t) => t > oneMinuteAgo);

      if (validRequests.length >= 10) return false;
      validRequests.push(now);
      return true;
    },
  };
};
```

**Action:** Add client-side rate limiting

---

## 🟡 MEDIUM SEVERITY ISSUES

### 8. **MISSING CSRF PROTECTION DETAILS**

**Location:** Cross-site requests in [App.tsx](App.tsx#L30-L60)  
**Severity:** MEDIUM  
**Status:** ✅ **Likely Protected** (Supabase handles)

**Analysis:**

- Supabase Auth handles CSRF tokens automatically
- Uses secure, HTTP-only cookies for sessions
- All state changes go through Supabase client library

**Verification:** No action needed if using Supabase auth helpers correctly

- Currently using `@supabase/auth-helpers-react` (✅ correct)
- HTTP-only sessions (✅ handled by Supabase)

**Recommendation:** Verify in production that cookies are marked:

```
- HttpOnly ✅
- Secure ✅ (HTTPS only)
- SameSite=Strict ✅
```

---

### 9. **NO AUTHORIZATION CHECKS IN SOUNDSCAPE EDIT**

**Location:** [src/pages/CreateSoundscapePage.tsx](src/pages/CreateSoundscapePage.tsx#L50-L100)  
**Severity:** MEDIUM  
**Issue:**

```typescript
// If someone visits /edit/123, code fetches soundscape but doesn't verify ownership
const loadExistingData = async () => {
  const { data: soundscape } = await supabase
    .from("soundscapes")
    .select("*")
    .eq("id", id)
    .single();

  // ⚠️ No check that user.id === soundscape.user_id
};
```

**Risk:**

- Frontend doesn't validate user owns the soundscape
- **BUT:** Backend RLS should prevent unauthorized updates
- Still allows information disclosure (can view others' soundscapes)

**Frontend Check Needed:**

```typescript
if (soundscape && soundscape.user_id !== user?.id) {
  navigate("/explore");
  notifications.show({
    title: "Unauthorized",
    message: "You don't have permission to edit this soundscape",
    color: "red",
  });
  return;
}
```

---

### 10. **HARDCODED REDIRECT DOMAIN IN SIGNUP**

**Location:** [src/components/Auth.tsx](src/components/Auth.tsx#L37)  
**Severity:** MEDIUM  
**Issue:**

```typescript
emailRedirectTo: "https://nilaerturk.com/soundscapes/",
```

**Risks:**

- Hardcoded domain won't work in dev/staging environments
- If domain changes, signup breaks
- Not environment-aware

**Fix:**

```typescript
const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
emailRedirectTo: `${baseUrl}/soundscapes/`,
```

**Add to .env:**

```
VITE_APP_URL=https://nilaerturk.com
```

---

### 11. **AVATAR URL WITH CACHE-BUSTING TIMESTAMP**

**Location:** [src/pages/ProfileSettings.tsx](src/pages/ProfileSettings.tsx#L75)  
**Severity:** MEDIUM (Information Disclosure)  
**Issue:**

```typescript
const {
  data: { publicUrl },
} = supabase.storage.from("avatars").getPublicUrl(filePath);
finalAvatarUrl = `${publicUrl}?t=${Date.now()}`;
```

**Risk:**

- Timestamp reveals when avatar was uploaded/modified
- Can infer user activity timing
- Public doesn't expose sensitive data but is unnecessary

**Better Practice:**

```typescript
// Use a version hash instead of timestamp
finalAvatarUrl = `${publicUrl}?v=${filePath.split("/")[1]}`;
```

---

## 🟢 LOW SEVERITY ISSUES / CODE QUALITY

### 12. **WEAK ERROR HANDLING IN DELETE OPERATIONS**

**Location:** [src/pages/SoundscapePage.tsx](src/pages/SoundscapePage.tsx#L150-L170)  
**Severity:** LOW  
**Issue:**

```typescript
const toggleSave = async () => {
  // ... deletion code ...
  if (error) {
    addSavedId(id); // Optimistic revert
    // But no error notification to user!
  }
};
```

**Fix:**

```typescript
if (error) {
  addSavedId(id);
  notifications.show({
    title: "Error",
    message: "Failed to remove sound. Please try again.",
    color: "red",
  });
}
```

---

### 13. **MISSING ERROR MESSAGE IN PROFILE DELETE**

**Location:** [src/pages/ProfileSettings.tsx](src/pages/ProfileSettings.tsx#L115)  
**Severity:** LOW  
**Issue:**

```typescript
const deleteAccount = async () => {
  // ...
  if (error) {
    notifications.show({
      title: "Error",
      message: error.message, // 🔴 Shows raw error message!
      color: "red",
    });
  }
};
```

**Fix:**

```typescript
if (error) {
  // Don't expose raw error
  console.error("Delete account error:", error);
  notifications.show({
    title: "Error",
    message: "Failed to delete account. Please contact support.",
    color: "red",
  });
}
```

---

### 14. **NO LOADING STATE INDICATION**

**Location:** Multiple pages use `loading` state but not always displayed  
**Severity:** LOW (UX Issue)  
**Example:** [src/pages/CreateSoundscapePage.tsx](src/pages/CreateSoundscapePage.tsx#L1-L50)

**Issue:**

- Form submission sets `isSubmitting` but button doesn't show loading state

**Fix:**

```typescript
<Button
  type="submit"
  loading={isSubmitting}
  disabled={isSubmitting}
>
  Create Soundscape
</Button>
```

---

### 15. **MISSING TYPE SAFETY IN API RESPONSES**

**Location:** Multiple files use `any` types

- [src/pages/CreateSoundscapePage.tsx](src/pages/CreateSoundscapePage.tsx#L150) - Line 150: `foundBooks: any[]`
- [src/pages/SoundscapePage.tsx](src/pages/SoundscapePage.tsx#L40) - `SoundscapeWithProfile` lacks full type

**Risk:** Runtime errors from unexpected API responses

**Fix:**

```typescript
// Define proper types
interface Book {
  id: string;
  title: string;
  authors: string[];
  thumbnail?: string;
}

const [foundBooks, setFoundBooks] = useState<Book[]>([]);
```

---

### 16. **NO IMPORT VALIDATION FOR PEXELS SDK**

**Location:** [src/lib/pexels.ts](src/lib/pexels.ts)  
**Severity:** LOW (Code Quality)  
**Issue:**

```typescript
// Pexels doesn't provide official SDK for JS
// Custom fetch wrapper is fragile
export const pexels = {
  photos: {
    search: async (params: Record<string, string | number>) => {
      // Manual URL construction vulnerable to injection
      const query = new URLSearchParams(params as Record<string, string>).toString();
```

**Better:** Use official Pexels API with proper validation

---

### 17. **SUPABASE FUNCTION CALLS LACK ERROR HANDLING**

**Location:** [src/pages/CreateSoundscapePage.tsx](src/pages/CreateSoundscapePage.tsx#L195-L210)  
**Severity:** LOW  
**Issue:**

```typescript
if (response.ok) {
  const data = await response.json();
  setFoundBooks(data.suggestions); // 🔴 No validation!
}
// No handling if response.ok but data is malformed
```

**Fix:**

```typescript
if (response.ok) {
  const data = await response.json();

  if (Array.isArray(data.suggestions)) {
    setFoundBooks(data.suggestions);
  } else {
    throw new Error("Invalid response format");
  }
}
```

---

## 📋 SUMMARY TABLE

| #   | Issue                          | Severity    | Category     | Status        |
| --- | ------------------------------ | ----------- | ------------ | ------------- |
| 1   | Hardcoded Supabase Project URL | 🔴 CRITICAL | Security     | ❌ NOT FIXED  |
| 2   | Google Books API Key Exposed   | 🔴 CRITICAL | Security     | ⚠️ VERIFY GIT |
| 3   | Pexels Key in Client Bundle    | 🔴 CRITICAL | Security     | ❌ NOT FIXED  |
| 4   | Supabase Anon Key (Intended)   | 🔴 CRITICAL | Security     | ✅ BY DESIGN  |
| 5   | Raw Error Logs                 | 🟠 HIGH     | Code Quality | ❌ NOT FIXED  |
| 6   | Missing Input Validation       | 🟠 HIGH     | Security     | ❌ NOT FIXED  |
| 7   | No Rate Limiting               | 🟠 HIGH     | Security     | ⚠️ PARTIAL    |
| 8   | CSRF Protection                | 🟡 MEDIUM   | Security     | ✅ SUPABASE   |
| 9   | Missing Auth Checks            | 🟡 MEDIUM   | Security     | ⚠️ VERIFY RLS |
| 10  | Hardcoded Redirect URL         | 🟡 MEDIUM   | Config       | ❌ NOT FIXED  |
| 11  | Avatar Cache Timestamp         | 🟡 MEDIUM   | Privacy      | ❌ NOT FIXED  |
| 12+ | Error Handling / UX            | 🟢 LOW      | Quality      | ✅ MINOR      |

---

## 🚨 IMMEDIATE ACTIONS REQUIRED

### Before Any Production Deployment:

1. **🔴 CRITICAL - NEXT 30 MINUTES:**
   - [ ] Check Git history for Google Books API key
   - [ ] Revoke & regenerate Google API key if found
   - [ ] Move hardcoded Supabase URLs to environment variables

2. **🔴 CRITICAL - TODAY:**
   - [ ] Create backend proxy for Pexels API calls
   - [ ] Audit Supabase RLS policies on all tables
   - [ ] Remove console.error statements or make them conditional

3. **🟠 HIGH - THIS WEEK:**
   - [ ] Add input validation to Auth form (use Zod + Mantine Form)
   - [ ] Implement client-side rate limiting
   - [ ] Update hardcoded domain to environment variable

4. **🟡 MEDIUM - BEFORE LAUNCH:**
   - [ ] Add auth checks in edit forms
   - [ ] Fix error message disclosure in delete operations
   - [ ] Add proper TypeScript types for all API responses

---

## 🔐 ENVIRONMENT CONFIGURATION CHECKLIST

```bash
# ✅ SHOULD BE IN .env (gitignore'd):
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=sb_publishable_...  # Public by design
VITE_APP_URL=https://yourdomain.com

# ❌ SHOULD NOT EXIST IN .env:
# VITE_BOOKS_API_KEY=... (use backend instead)
# VITE_PEXELS_API_KEY=... (use backend proxy instead)

# ❌ SHOULD NEVER BE COMMITTED:
# Session tokens
# Private API keys
# Database credentials
# OAuth secrets
```

---

## 📚 REFERENCES & BEST PRACTICES

### Key Security Resources:

- [OWASP: API Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Content Security Policy](https://owasp.org/www-community/attacks/xss/)

### Recommended Fixes:

- Implement Sentry or similar for error tracking (not console.log)
- Use environment variable manager (dotenv-safe, etc.)
- Add API gateway/reverse proxy for third-party APIs
- Implement proper logging strategy (structured JSON logs)

---

**Report Generated:** March 9, 2026  
**Reviewer:** GitHub Copilot Security Analysis  
**Recommendation:** Address CRITICAL issues before production. Schedule follow-up review after fixes.
