# User Guide: New Features in Todo-Ring 2-6

## Table of Contents
1. [AI-Powered Task Prioritization](#ai-powered-task-prioritization)
2. [Workload Analytics Dashboard](#workload-analytics-dashboard)
3. [Dynamic Template System](#dynamic-template-system)
4. [Platform-Specific Notifications](#platform-specific-notifications)
5. [Enhanced Accessibility Features](#enhanced-accessibility-features)
6. [Security Enhancements](#security-enhancements)

## AI-Powered Task Prioritization

### How It Works
The system uses machine learning to predict optimal task priorities based on:
- Historical task completion patterns
- Deadline proximity
- Task complexity estimates
- Team workload distribution

### Using AI Recommendations
1. **Task Creation**: When creating a new task, click the "AI Suggest Priority" button
2. **Bulk Operations**: Select multiple tasks and choose "AI Optimize Priorities"
3. **Daily Review**: Check the AI Insights panel in your dashboard each morning

### Understanding Priority Levels
- **Urgent**: Due within 24 hours or marked urgent by user
- **High**: Important deadlines or high business impact
- **Medium**: Standard tasks with flexible timelines
- **Low**: Background tasks or low-priority items

### Customizing AI Behavior
Access Settings > AI Preferences to:
- Adjust prediction sensitivity
- Set preferred working hours
- Define important project tags
- Control how aggressively the AI suggests priority changes

## Workload Analytics Dashboard

### Team Capacity Planning
View your team's current workload distribution in real-time:

#### Member Utilization Cards
Each team member shows:
- Current utilization percentage (green/yellow/red indicators)
- Capacity vs. allocated hours
- Upcoming task load for the week
- Status indicators (overloaded/balanced/underloaded)

#### Weekly Heatmap
Visualizes task distribution across:
- Team members (rows)
- Days of the week (columns)
- Color intensity indicates workload intensity

#### Analytics Sections
- **Capacity Overview**: Total available hours vs. allocated hours
- **Trend Analysis**: Workload patterns over the last 4 weeks
- **Bottleneck Identification**: Team members consistently over 85% utilization

### Taking Action
From the dashboard, you can:
- Click any member card to see their detailed task list
- Drag tasks between members to rebalance workload
- Set capacity limits for individual team members
- Export reports for team meetings

## Dynamic Template System

### Creating Custom Templates
1. Go to Templates > Create New
2. Define template fields:
   - Text fields (short/long answers)
   - Number fields (estimates, counts)
   - Date fields (deadlines, milestones)
   - Select dropdowns (categories, statuses)
   - Checkboxes (binary options)
3. Set default values and validation rules
4. Save and share with your team

### Using Templates
When creating a new task:
1. Click "Use Template" in the task creation form
2. Browse or search available templates
3. Select a template to pre-fill the task form
4. Modify fields as needed before saving

### Template Marketplace
Browse community-created templates:
- Filter by category (project management, personal goals, etc.)
- Preview template structure before using
- Rate and comment on templates
- Share your own templates with the team

### Template Validation
All templates are validated using Zod to ensure:
- Required fields are present
- Data types are correct
- Values fall within acceptable ranges
- Custom validation rules are enforced

## Platform-Specific Notifications

### How It Works
The system detects your current platform and delivers notifications through your preferred channel:

#### Platform Detection
- **Mobile**: Detected via user agent or Firebase/APNS registration
- **Desktop**: Detected via browser capabilities or native app
- **Web**: Default browser notifications
- **Email**: Fallback for all platforms

### Configuring Preferences
Go to Settings > Notifications to set:
- Preferred notification times (quiet hours)
- Platform-specific enable/disable toggles
- Notification types to receive (task reminders, mentions, assignments)
- Lead time for reminders (5, 10, 15, 30 minutes)

### Smart Delivery Logic
The system intelligently routes notifications:
- Urgent tasks: Sent via all enabled platforms
- Regular reminders: Sent via preferred platform only
- Mentions: Always sent via email + preferred platform
- Assignments: Sent via push notification + email

## Enhanced Accessibility Features

### Screen Reader Support
Improved accessibility for users relying on screen readers:
-2-6 screen readers:

#### Navigation Improvements
- Logical tab order throughout the application
- Skip navigation links for quick access to main content
- Proper ARIA labels for all interactive elements
- Landmark regions (header, main, navigation, footer)

#### Content Accessibility
- All icons have descriptive aria-label attributes
- Charts and graphs include text alternatives
- Form fields have associated labels and instructions
- Error messages are announced immediately

#### Keyboard Navigation
Full keyboard accessibility:
- Tab order follows logical flow
- Enter/Space activates buttons and links
- Arrow keys navigate within menus and dropdowns
- Escape closes modals and dropdowns
- Home/End navigate to beginning/end of lists

### Visual Accessibility
Enhanced for users with visual impairments:
- Improved color contrast ratios (WCAG AA compliant)
- Resizable text without breaking layout
- Focus indicators visible on all interactive elements
- Option to enable high contrast mode in settings

### Customization Options
Users can adjust:
- Text size (small/medium/large/extra large)
- Color scheme (light/dark/high contrast)
- Animation preferences (reduce motion option)
- Font selection (including dyslexia-friendly fonts)

## Security Enhancements

### Authentication Improvements
Your account security has been strengthened with:

#### JWT Token Security
- Host binding prevents token reuse across domains
- Short-lived access tokens (30 minutes) with refresh mechanism
- Automatic token rotation on suspicious activity
- Environment-based secret management

#### Rate Limiting
Protections against abuse:
- 100 requests per minute per IP address
- Stricter limits on authentication endpoints (10 attempts/minute)
- Automatic blocking after 5 failed login attempts
- CAPTCHA challenge after suspicious activity patterns

#### Additional Security Layers
- OTP verification for sensitive operations (password changes, data exports)
- Input sanitization prevents injection attacks
- Security headers (HSTS, CSP, X-Frame-Options) enabled
- Regular dependency scanning for vulnerabilities

### Privacy Controls
Control how your data is used:
- Opt-out of anonymous usage analytics
- Data export and deletion capabilities
- Session management with device-specific tokens
- Audit log access for account activity review

## Getting Started with New Features

### First-Time Setup
1. Complete the onboarding tour when you first log in
2. Configure your notification preferences
3. Set up your AI priority settings
4. Invite team members to start using workload analytics
5. Create your first custom template

### Tips for Maximum Benefit
- Check AI suggestions daily for the first week to train the system
- Use the workload dashboard in your weekly team planning meetings
- Create templates for recurring task types to save time
- Enable quiet hours to reduce notification fatigue
- Review security settings monthly for optimal protection

### Need Help?
- In-app tooltips explain new features as you encounter them
- Video tutorials available in the Help > Tutorials section
- Community forums for sharing templates and tips
- 24/7 support for critical issues

---

*Last updated: July 2026 | Todo-Ring 2-6 Version 1.1.0*