# Email Notifications Setup for Happy Tomato

This guide will help you set up email notifications for your garden TODO reminders using EmailJS.

## Prerequisites
- EmailJS account (free tier available)
- Gmail, Outlook, or other email service

## Step 1: Create EmailJS Account

1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Connect Your Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the authentication flow to connect your email
5. Note down the **Service ID** (e.g., `service_abc123`)

## Step 3: Create Email Template

1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template**
3. Use this template content:

### Template Name: `garden_todo_reminder`

### Subject:
```
🌱 {{reminder_type}} - {{app_name}}
```

### HTML Body:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .todo-item { background-color: #f8f9fa; padding: 10px; margin: 5px 0; border-left: 4px solid #28a745; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 0.9em; color: #666; }
        .overdue { border-left-color: #dc3545 !important; }
        .due-today { border-left-color: #ffc107 !important; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌱 {{app_name}}</h1>
        <p>{{reminder_type}} for {{to_name}}</p>
    </div>
    
    <div class="content">
        <h2>Hello {{to_name}}!</h2>
        
        <p>Here are your garden TODOs for {{today_date}}:</p>
        
        <h3>📋 You have {{todo_count}} pending task(s):</h3>
        
        <div style="white-space: pre-line; font-family: monospace;">{{todo_list}}</div>
        
        <p>🌟 Keep up the great work with your garden!</p>
        
        <p>Remember to check off completed tasks in your Happy Tomato app.</p>
    </div>
    
    <div class="footer">
        <p>This reminder was sent from your {{app_name}} garden planner.</p>
        <p>To stop receiving these reminders, please adjust your notification settings in the app.</p>
    </div>
</body>
</html>
```

### Text Body (fallback):
```
{{app_name}} - {{reminder_type}}

Hello {{to_name}},

Here are your garden TODOs for {{today_date}}:

{{todo_list}}

Keep up the great work with your garden!

Remember to check off completed tasks in your Happy Tomato app.

---
This reminder was sent from your {{app_name}} garden planner.
To stop receiving these reminders, please adjust your notification settings in the app.
```

4. Save the template and note down the **Template ID** (e.g., `template_xyz789`)

## Step 4: Get Your Public Key

1. Go to **Account** in EmailJS dashboard
2. Find your **Public Key** (e.g., `user_abc123xyz`)

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env` in your project root
2. Fill in your EmailJS credentials:

```env
# EmailJS Configuration
REACT_APP_EMAILJS_SERVICE_ID=service_abc123
REACT_APP_EMAILJS_TEMPLATE_ID=template_xyz789
REACT_APP_EMAILJS_PUBLIC_KEY=user_abc123xyz
```

## Step 6: Test Your Setup

1. Start your React app: `npm start`
2. Click the email icon in the header
3. Enter your email address
4. Click "Send Test Email"
5. Check your inbox for the test email

## Email Template Variables

The following variables are automatically populated:

- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name (or "Garden Friend")
- `{{reminder_type}}` - Type of reminder (e.g., "Daily Garden Reminder")
- `{{todo_count}}` - Number of pending TODOs
- `{{todo_list}}` - Formatted list of TODOs with dates and plant labels
- `{{today_date}}` - Current date
- `{{app_name}}` - "Happy Tomato Garden Planner"

## Troubleshooting

### Email Not Sending
1. Check your environment variables are correct
2. Verify your EmailJS service is active
3. Check browser console for error messages
4. Ensure your email service (Gmail, etc.) is properly connected

### Template Not Rendering
1. Verify all variable names match exactly (including curly braces)
2. Check that template ID is correct
3. Test with a simple template first

### Rate Limits
- EmailJS free tier: 200 emails/month
- Consider upgrading if you need more

## Security Notes

- Environment variables are only used in the client-side app
- EmailJS handles the actual email sending securely
- Never commit your `.env` file to version control
- Your email credentials are safely stored with EmailJS

## Support

- EmailJS Documentation: https://www.emailjs.com/docs/
- EmailJS Support: https://www.emailjs.com/contact/

## Features

Your email notifications will include:

✅ **Daily reminders** at your chosen time  
✅ **Advance reminders** (3+ days before TODOs are due)  
✅ **Overdue TODO alerts**  
✅ **Due today notifications**  
✅ **Plant-specific labeling**  
✅ **Beautiful HTML formatting**  
✅ **Mobile-friendly design**  
✅ **Customizable advance warning days** (1-14 days)

Enjoy your automated garden reminders! 🌱

