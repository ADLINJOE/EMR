# Patient Follow-ups System - Setup & Testing Guide

## Overview
Complete patient follow-ups functionality has been implemented with backend API, database schema, and frontend component integration.

## What Was Implemented

### 1. Database Schema Fixed
- **Fixed table mismatch**: Added `patient_followups` table to match FollowUpController expectations
- **Added missing field**: `reminder_days_before` for flexible reminder scheduling
- **Maintained compatibility**: Kept legacy `follow_up_reminders` table
- **Location**: `database_schema.sql`

### 2. Backend API Enhanced
- **New endpoints added**:
  - `GET /api/PatientManagement/FollowUp/Upcoming?days=30` - Get upcoming follow-ups
  - `POST /api/PatientManagement/FollowUp/{id}/ScheduleReminder` - Schedule email reminders
  - `DELETE /api/PatientManagement/FollowUp/{id}` - Cancel follow-ups
- **Integration**: Automatic email scheduling via NotificationsController
- **Location**: `FollowUpController.cs`

### 3. Frontend Component Created
- **Component**: `patient-followups.component.ts/html/scss`
- **Features**:
  - Patient selection integration from SharedService
  - Follow-up scheduling with date/time picker
  - Email reminder configuration
  - Status management (Active/Completed/Cancelled)
  - Upcoming follow-ups dashboard
  - Responsive Material Design UI
- **Route**: `/MainLayout/patient-followups`

## Setup Instructions

### 1. Database Setup
```sql
-- Run the updated database_schema.sql to create the patient_followups table
-- This will create both patient_followups and maintain legacy follow_up_reminders
```

### 2. Backend Configuration
Ensure your `appsettings.json` has SMTP settings for email notifications:
```json
{
  "SmtpSettings": {
    "Host": "smtp.gmail.com",
    "Port": "587",
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "noreply@rxsmart.com",
    "FromName": "RxSmart EMR System"
  }
}
```

### 3. Add to Navigation Menu
To add the follow-ups component to your navigation menu, you need to add it to your menu items configuration. The menu system uses the SharedService to populate navigation items.

Add this menu item configuration wherever your menu items are defined:
```typescript
{
  componentName: "PatientFollowupsComponent",
  componentPath: "patient-followups",
  icon: "schedule",
  startPage: false
}
```

## Testing the System

### 1. Basic Functionality Test
1. **Navigate to Patient List**: Select a patient first
2. **Access Follow-ups**: Navigate to `/MainLayout/patient-followups`
3. **Schedule Follow-up**: 
   - Click "Schedule Follow-up"
   - Set date/time and notes
   - Enable email reminder
   - Save

### 2. Email Notification Test
1. **Schedule a follow-up** with email reminder enabled
2. **Check email_reminders table** for scheduled reminder
3. **Test immediate sending**: Set reminder date to current time
4. **Verify email delivery** (check SMTP logs)

### 3. Dashboard Features Test
1. **Upcoming Follow-ups**: View next 30 days appointments
2. **Status Management**: Mark follow-ups as completed/cancelled
3. **Visual Indicators**: Check overdue/today highlighting
4. **Patient Integration**: Verify patient details display correctly

## API Endpoints Reference

### Create Follow-up
```http
POST /api/PatientManagement/FollowUp
Content-Type: application/json

{
  "patientId": "P001",
  "followUpDate": "2024-01-15T10:00:00",
  "notes": "Regular checkup",
  "emailReminder": true,
  "reminderDaysBefore": 1,
  "createdBy": "Dr. Smith",
  "createdDate": "2024-01-10T10:00:00"
}
```

### Get Patient Follow-ups
```http
GET /api/PatientManagement/FollowUp/{patientId}
```

### Get Upcoming Follow-ups
```http
GET /api/PatientManagement/FollowUp/Upcoming?days=30
```

### Schedule Email Reminder
```http
POST /api/PatientManagement/FollowUp/{followUpId}/ScheduleReminder
Content-Type: application/json

{
  "recipientEmail": "patient@email.com"
}
```

### Update Follow-up Status
```http
PUT /api/PatientManagement/FollowUp/{followUpId}
Content-Type: application/json

{
  "status": "Completed"
}
```

### Cancel Follow-up
```http
DELETE /api/PatientManagement/FollowUp/{followUpId}
```

## Database Tables

### patient_followups
- `id` (BIGINT, Primary Key)
- `patient_id` (VARCHAR(50))
- `followup_date` (DATETIME)
- `notes` (TEXT)
- `email_reminder` (BOOLEAN)
- `reminder_days_before` (INT)
- `created_by` (VARCHAR(100))
- `created_date` (DATETIME)
- `updated_date` (DATETIME)
- `status` (ENUM: 'Active', 'Completed', 'Cancelled')
- `reminder_sent` (BOOLEAN)

### email_reminders
- `id` (BIGINT, Primary Key)
- `patient_id` (VARCHAR(50))
- `followup_date` (DATETIME)
- `reminder_date` (DATETIME)
- `recipient_email` (VARCHAR(255))
- `notes` (TEXT)
- `status` (ENUM: 'Scheduled', 'Sent', 'Failed', 'Cancelled')
- `sent_date` (DATETIME)
- `error_message` (TEXT)

## Troubleshooting

### Common Issues
1. **Component not loading**: Ensure route is added to `app.routes.ts`
2. **Patient not selected**: Use patient list to select patient first
3. **Email not sending**: Check SMTP configuration in appsettings.json
4. **Database errors**: Verify patient_followups table exists
5. **Navigation missing**: Add menu item to SharedService menu configuration

### Error Logs
- Check browser console for frontend errors
- Check server logs for API/email errors
- Verify database connection and table structure

## Next Steps
1. **Add to menu**: Configure navigation menu item
2. **Test thoroughly**: Verify all functionality works
3. **Configure SMTP**: Set up email server for notifications
4. **User training**: Train staff on new follow-up features
5. **Monitor**: Check email delivery and system performance
