User (supabase default)
- E-Mail
- Displayname
- Password

Settings
- Language
- Theme
- Notifications
- FK UserID

Feedback
- FK Author
- FK Receiver
- FeedbackTitle
- FeedbackText
- CreatedAt default currentTimestamp

FeedbackReceiver
- FK FeedbackID
- FK UserID
- ReadFlag default false
- PrivateFlag default false

Role
- RoleName

UserRole
- FK UserID
- FK RoleID