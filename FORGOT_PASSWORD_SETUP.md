# Forgot Password Setup Guide

This guide will help you set up the forgot password functionality for both Login and Patient Registration components.

## 1. Database Setup

Run the following SQL commands to create the required table:

```sql
-- Create password_reset_tokens table for forgot password functionality
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    used_at DATETIME NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_reset_token (reset_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_used (is_used),
    UNIQUE KEY unique_user_email (user_id, email)
);
```

## 2. Backend Configuration

### AuthController.cs
The AuthController is already configured to work with both:
- **Users table**: For staff/admin accounts (login component)
- **Patients table**: For patient accounts (patient registration component)

### API Endpoints Available:
- `POST /api/Auth/ForgotPassword` - Send password reset email
- `POST /api/Auth/ResetPassword` - Reset password with token

## 3. Frontend Configuration

### Service Endpoint
The forgot password dialog uses: `api/Auth/ForgotPassword`

### Components Integration
Both components now have "Forgot Password?" links that open the same dialog:

1. **Login Component**: Line 36 in `login.component.html`
2. **Patient Registration Component**: Line 20 in `patient-registrationlink.component.html`

## 4. SMTP Configuration

Update your `appsettings.json` with your email provider settings:

```json
{
  "SmtpSettings": {
    "Host": "smtp.gmail.com",
    "Port": "587",
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "noreply@rxsmart.com",
    "FromName": "RxSmart EMR System"
  },
  "AppSettings": {
    "BaseUrl": "http://localhost:4200"
  }
}
```

### Gmail Setup (if using Gmail):
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in the `Password` field

## 5. Testing the Functionality

### Test Cases:

1. **Valid Email (User exists)**:
   - Enter existing email from users or patients table
   - Should receive success message and email

2. **Invalid Email (User doesn't exist)**:
   - Enter non-existent email
   - Should show: "Email not found. Please register first or check your email address."

3. **Email Validation**:
   - Enter invalid email format
   - Should show validation error

## 6. Email Template Features

The system sends professional HTML emails with:
- User name personalization
- Account type identification (User/Patient)
- Secure reset link with 1-hour expiration
- Security warnings and instructions
- Branded RxSmart EMR styling

## 7. Security Features

- **Token Expiration**: 1 hour from generation
- **One-time Use**: Tokens are marked as used after password reset
- **Secure Generation**: Cryptographically secure random tokens
- **Email Validation**: Checks both users and patients tables
- **Dual Table Updates**: Updates password in both users and patients tables

## 8. Troubleshooting

### Common Issues:

1. **SMTP Errors**: Check email credentials and server settings
2. **Database Errors**: Ensure password_reset_tokens table exists
3. **CORS Issues**: Ensure API endpoints are accessible from frontend
4. **Email Not Received**: Check spam folder, verify SMTP configuration

### Debug Steps:

1. Check browser console for API errors
2. Verify database connection string
3. Test SMTP settings with a simple email
4. Check server logs for detailed error messages

## 9. File Locations

### Frontend Files:
- `src/app/Modules/Components/Shared/forgot-password-dialog/`
- `src/app/Modules/Components/Login/login/login.component.ts`
- `src/app/Modules/Components/Patient/patient-registrationlink/patient-registrationlink.component.ts`

### Backend Files:
- `AuthController.cs`
- `appsettings.json`

### Database:
- `database_schema.sql` (updated with password_reset_tokens table)

## 10. Next Steps

1. Update SMTP settings in `appsettings.json`
2. Run the database schema update
3. Test with both login and patient registration components
4. Configure your email provider settings
5. Test the complete flow from forgot password to password reset

The system is now ready to handle forgot password requests from both login and patient registration components using the same unified AuthController.
