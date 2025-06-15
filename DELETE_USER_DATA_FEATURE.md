# Delete All User Data Feature

## Overview
This feature allows users to completely erase all their data from the Argus finance application, including their account and all associated financial records.

## How it works

### User Interface
- A new "Delete All Data" option has been added to the user avatar dropdown menu
- The option appears with a red trash icon to indicate its destructive nature
- When clicked, it opens a comprehensive confirmation dialog

### Confirmation Dialog
The confirmation dialog includes:
- ⚠️ Clear warning that the action cannot be undone
- Detailed list of what will be deleted:
  - All financial transactions
  - All uploaded bank statements
  - All email data and attachments
  - All account balances and history
  - User profile and preferences
  - The entire user account from the system
- Cancel and Delete buttons with proper loading states

### Data Deletion Process
When confirmed, the system will delete data in the following order:

1. **Balances** - All account balance records
2. **Transactions** - All financial transaction records
3. **Emails** - All email records and attachments
4. **Statements** - All uploaded bank statement files
5. **User Profile** - User preferences and profile information
6. **Auth Account** - Complete removal from Supabase authentication

### Technical Implementation

#### API Endpoint
- **Route**: `/api/delete-user-data`
- **Method**: `DELETE`
- **Authentication**: Required (user must be logged in)
- **Body**: `{ confirmed: true }`

#### Database Tables Affected
- `all_transactions` - All user transactions deleted
- `balances` - All user balances deleted
- `emails` - All user emails deleted
- `statements` - All user statements deleted
- `users` - User profile deleted
- `auth.users` - Authentication record deleted

#### Security Features
- User authentication required
- Confirmation parameter required in request body
- Only deletes data belonging to the authenticated user
- Admin Supabase client used for reliable deletion
- Proper error handling and rollback on failures

### User Experience
- User clicks "Delete All Data" from the dropdown
- Comprehensive warning dialog appears
- User must explicitly click "Delete Everything" to proceed
- Loading state shown during deletion process
- User automatically redirected to home page after successful deletion
- Account is completely removed and user is logged out

### Error Handling
- Proper error messages for failed deletions
- Partial deletion prevention (if one step fails, user is notified)
- User remains logged in if deletion fails
- Console logging for debugging purposes

## Usage Instructions

1. **Access the Feature**:
   - Click on your avatar in the top navigation
   - Select "Delete All Data" from the dropdown menu

2. **Review the Warning**:
   - Read the comprehensive list of what will be deleted
   - Understand that this action cannot be undone

3. **Confirm Deletion**:
   - Click "Delete Everything" to proceed
   - Or click "Cancel" to abort the operation

4. **Completion**:
   - Wait for the deletion process to complete
   - You will be automatically logged out and redirected
   - Your account and all data will be permanently removed

## Important Notes

⚠️ **This action is irreversible** - Once data is deleted, it cannot be recovered.

🔐 **Security** - Only the authenticated user can delete their own data.

🗑️ **Complete Removal** - This includes all financial data, statements, emails, and the user account itself.

💾 **No Backups** - The system does not create backups before deletion.

## Support
If you encounter any issues with the deletion process, please contact support immediately. Note that once the process completes successfully, no data recovery is possible. 