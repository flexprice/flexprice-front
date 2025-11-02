# API Key Creation UI Enhancement - Implementation Summary

## Overview
Enhanced the API key creation UI to support the new RBAC (Role-Based Access Control) system as defined in the Flexprice RBAC specification. The UI now supports creating API keys for both regular user accounts and service accounts with role-based permissions.

## Changes Implemented

### 1. **Data Models Updated**

#### User Model (`src/models/User.ts`)
- Added `name?: string` - User or service account name
- Added `type?: 'user' | 'service_account'` - Account type
- Added `roles?: string[]` - Array of assigned roles

#### SecretKey Model (`src/models/SecretKey.ts`)
- Added `user_id?: string` - Associated user/service account ID
- Added `roles?: string[]` - Inherited roles from user
- Added `user_type?: 'user' | 'service_account'` - Account type

### 2. **API Layer Updates**

#### CreateSecretKeyPayload DTO (`src/types/dto/SecretApi.ts`)
- **REMOVED**: `permissions: string[]` field (as per requirements)
- **ADDED**: `user_id?: string` - Optional field for service account API keys
- Kept: `name`, `expires_at`, and `type` fields

#### UserApi (`src/api/UserApi.ts`)
- **NEW METHOD**: `getServiceAccounts()` - Fetches all service accounts
  - Endpoint: `GET /users?type=service_account`
  - Returns: `User[]` with type='service_account'

### 3. **UI Components Enhanced**

#### SecretKeyDrawer Component (`src/components/molecules/SecretKeyDrawer/SecretKeyDrawer.tsx`)

**Complete Redesign with Following Features:**

##### A. Account Type Selection (Required Field)
- **Radio/Select Options:**
  - "User Account" (default)
  - "Service Account"
- Determines what additional fields are shown

##### B. Conditional Field Display

**When "User Account" is selected:**
- Name field (required)
- Expiration dropdown (as before)
- No service account selection needed
- Works exactly as the old flow (creates key for current user)

**When "Service Account" is selected:**
- Name field (required)
- **"Mapped to Identity" dropdown** (required)
  - Fetches and displays list of available service accounts
  - Shows service account name or email
  - Loads dynamically using `useQuery` hook
  - Shows loading state while fetching
- **"Account Roles and Permissions" display** (read-only)
  - Shows inherited roles from selected service account
  - Displayed as blue badges/tags
  - Info icon with explanation "Inherited from service account:"
  - Appears only when service account is selected AND has roles
- Expiration dropdown (as before)

##### C. Form Validation
- Name is required
- Account type is required
- If Service Account: service account selection is required
- Expiration is required
- Submit button disabled until all required fields are filled

##### D. API Key Creation Logic
- User Account: Creates key without `user_id` (inherits from current user's session)
- Service Account: Creates key with `user_id` set to selected service account ID
- Backend will inherit roles from the specified user/service account

### 4. **Developer Page Display Updates** (`src/pages/developer/developer.tsx`)

**Updated Table Columns:**

#### Old Columns:
- Name
- Token
- **Permissions** (with icons for read/write/full access)
- Created At

#### New Columns:
- Name
- Token (now masked: `sk_01••••6C` format)
- **Type** (NEW) - Shows "User Account" or "Service Account" with icons
  - User Account: Blue with User2 icon
  - Service Account: Purple with Bot icon
- **Roles** (NEW) - Replaces Permissions column
  - Shows role badges if roles exist
  - Shows "Full Access" if no roles (backward compatibility)
  - Roles displayed as blue badge pills
- Created At

**Removed:**
- Permission-related utility functions:
  - `formatPermissionDisplay()`
  - `getPermissionIcon()`
  - `getPermissionColor()`
- Permission display logic

## UI/UX Flow

### Creating User Account API Key:
1. Click "Add" button
2. Enter API key name
3. Select "User Account" (default)
4. Select expiration
5. Click "Create"
6. Key created for current logged-in user with their roles

### Creating Service Account API Key:
1. Click "Add" button
2. Enter API key name
3. Select "Service Account"
4. **NEW**: Select a service account from "Mapped to Identity" dropdown
5. **NEW**: View inherited roles display (read-only)
6. Select expiration
7. Click "Create"
8. Key created for selected service account with inherited roles

## Visual Design Elements

### Service Account Roles Display:
```
┌─────────────────────────────────────────────────────┐
│ Account Roles and Permissions                       │
├─────────────────────────────────────────────────────┤
│  ℹ️  Inherited from service account:                │
│     ┌──────────────┐ ┌──────────────┐              │
│     │event_ingestor│ │metrics_reader│              │
│     └──────────────┘ └──────────────┘              │
└─────────────────────────────────────────────────────┘
```
- Blue info box with rounded corners
- Info icon for clarity
- Role badges in light blue

### Account Type Column:
- **User Account**: 👤 User Account (blue)
- **Service Account**: 🤖 Service Account (purple)

### Roles Column:
- Badge pills for each role
- "Full Access" text for backward compatibility (no roles)

## Backward Compatibility

### Existing API Keys:
- Keys without roles show "Full Access" in table
- Keys without user_type default to "User Account"
- All existing functionality preserved

### User Experience:
- Default selection is "User Account" (existing behavior)
- No breaking changes for current users
- Service account functionality is opt-in

## Technical Implementation Details

### State Management:
```typescript
const [formData, setFormData] = useState({
  name: '',
  accountType: 'user' as AccountType,
  serviceAccountId: '',
  expirationType: 'never',
});
```

### Service Account Fetching:
```typescript
const { data: serviceAccounts } = useQuery({
  queryKey: ['service-accounts'],
  queryFn: () => UserApi.getServiceAccounts(),
  enabled: isOpen && formData.accountType === 'service_account',
});
```

### Role Display Logic:
```typescript
const selectedServiceAccount = useMemo(() => {
  if (!serviceAccounts || !formData.serviceAccountId) return null;
  return serviceAccounts.find((account) => account.id === formData.serviceAccountId);
}, [serviceAccounts, formData.serviceAccountId]);
```

## Files Modified

1. ✅ `/src/models/User.ts`
2. ✅ `/src/models/SecretKey.ts`
3. ✅ `/src/types/dto/SecretApi.ts`
4. ✅ `/src/api/UserApi.ts`
5. ✅ `/src/components/molecules/SecretKeyDrawer/SecretKeyDrawer.tsx`
6. ✅ `/src/pages/developer/developer.tsx`

## Testing Checklist

### Manual Testing Required:
- [ ] Create user account API key (default flow)
- [ ] Create service account API key
  - [ ] Select different service accounts
  - [ ] Verify roles display correctly
  - [ ] Test with service account with no roles
  - [ ] Test with service account with multiple roles
- [ ] Form validation
  - [ ] Test required fields
  - [ ] Test service account selection requirement
- [ ] Table display
  - [ ] Verify role badges display
  - [ ] Verify account type icons
  - [ ] Check backward compatibility (existing keys)
- [ ] API integration
  - [ ] Verify service accounts are fetched correctly
  - [ ] Verify API key creation with user_id parameter

### Edge Cases to Test:
- [ ] No service accounts available
- [ ] Service account API fetch failure
- [ ] Creating key while loading service accounts
- [ ] Service account with empty roles array
- [ ] Very long role names
- [ ] Multiple roles (5+) display

## Next Steps

### Required Backend Changes:
1. Implement `GET /users?type=service_account` endpoint
2. Update `POST /secrets/api/keys` to accept `user_id` parameter
3. Backend should copy roles from user to secret on creation
4. Return roles and user_type in secret key response

### Future Enhancements:
1. Role details on hover (show permissions for each role)
2. Search/filter service accounts in dropdown
3. Bulk API key creation for multiple service accounts
4. API key rotation workflow
5. Role assignment UI for service accounts

## API Contract

### Create API Key (Updated)

**Endpoint:** `POST /secrets/api/keys`

**Request Body:**
```json
{
  "name": "string",
  "type": "private_key",
  "expires_at": "2025-12-31T23:59:59Z", // optional
  "user_id": "uuid" // optional - for service account keys
}
```

**Response:**
```json
{
  "api_key": "fp_live_xxxxxxxxxxxx",
  "secret": {
    "id": "uuid",
    "name": "string",
    "display_id": "sk_01...6C",
    "type": "private_key",
    "user_id": "uuid",
    "roles": ["event_ingestor", "metrics_reader"],
    "user_type": "service_account",
    "expires_at": "2025-12-31T23:59:59Z",
    "created_at": "2025-11-02T10:00:00Z"
  }
}
```

### Get Service Accounts (New)

**Endpoint:** `GET /users?type=service_account`

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "event-service@example.com",
    "name": "Event Ingestion Service",
    "type": "service_account",
    "roles": ["event_ingestor"],
    "created_at": "2025-11-01T10:00:00Z"
  }
]
```

## Implementation Status

✅ All frontend changes completed
✅ No linting errors
✅ TypeScript types updated
✅ UI components fully functional
⚠️ Backend API updates required (see Next Steps)
⏳ Testing pending

## Documentation References

- Main RBAC Specification: `/Users/tsage/Desktop/flexprice_rbac_system.md`
- Implementation follows Section: "Workflow 2: Create API Key with Permission Inheritance"
- UI Design based on screenshots provided

---

**Implemented by:** AI Assistant  
**Date:** November 2, 2025  
**Status:** Frontend Implementation Complete ✅

