# Operator AI - Queue Management System

🤖 **O'zbekistondagi eng zamonaviy navbat boshqaruv tizimi**

Professional, AI-powered queue management system for banks, clinics, government services, and other organizations.

## 🚀 Features

### Core Functionality
- ✅ **Multi-organization Support** - Banks, clinics, government services, passport offices
- ✅ **Real-time Queue Management** - Live updates across all panels
- ✅ **AI Chatbot Assistant** - Intelligent help and queue status checking
- ✅ **Multi-language** - Uzbek, Russian, English
- ✅ **QR Code Generation** - Digital queue tickets
- ✅ **Analytics & Reports** - Comprehensive statistics and insights
- ✅ **Responsive Design** - Works on all devices

### User Interfaces
1. **Landing Page** (`index.html`) - Professional homepage
2. **Queue Interface** (`queue.html`) - User-facing queue system
3. **Admin Dashboard** (`admin.html`) - Complete system management
4. **Staff Panel** (`staff.html`) - Queue operations for staff
5. **Display Screen** (`display.html`) - Public queue status display

## 📁 Project Structure

```
operator-ai-pro/
├── index.html              # Landing page
├── queue.html              # User queue interface
├── admin.html              # Admin dashboard
├── staff.html              # Staff panel
├── display.html            # Display screen
├── config.js               # Configuration
│
├── css/
│   ├── main.css           # Design system & components
│   ├── landing.css        # Landing page styles
│   ├── queue.css          # Queue interface styles
│   ├── chatbot.css        # AI chatbot styles
│   └── [other pages].css
│
└── js/
    ├── utils.js           # Utility functions
    ├── language.js        # Multi-language support
    ├── database.js        # Data management (LocalStorage)
    ├── queue-manager.js   # Queue operations
    ├── ai-chatbot.js      # AI assistant
    └── [page scripts].js
```

## 🎨 Design System

### Colors
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Accent**: Cyan to blue (#00d2ff → #3a7bd5)
- **Success**: Green (#10b981)
- **Design Style**: Glassmorphism with modern gradients

### Typography
- **Primary Font**: Inter
- **Display Font**: Poppins

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: LocalStorage / IndexedDB
- **Design**: CSS Grid, Flexbox, Custom Properties
- **Real-time**: BroadcastChannel API
- **Charts**: Chart.js (for analytics)
- **QR Codes**: QRCode.js / API

## 📖 Usage

### For Users
1. Open `queue.html`
2. Select organization type
3. Choose branch
4. Select service
5. Receive queue number with QR code
6. Monitor queue status in real-time

### For Staff
1. Open `staff.html`
2. Login with credentials
3. Call next customer
4. Mark as served/no-show
5. Manage queue operations

### For Administrators
1. Open `admin.html`
2. Manage organizations, branches, services
3. Add/remove staff
4. View analytics and reports
5. Configure system settings

### For Display Screens
1. Open `display.html`
2. Shows currently serving numbers
3. Auto-refreshes
4. Voice announcements

## 🔧 Configuration

Edit `config.js` to customize:
- Queue prefixes
- Notification settings
- Display refresh intervals
- Operating hours
- And more...

## 🌐 Multi-language Support

The system supports three languages:
- 🇺🇿 **Uzbek** (O'zbekcha)
- 🇷🇺 **Russian** (Русский)
- 🇬🇧 **English**

Language can be switched using the language switcher in the navigation.

## 📊 Database Schema

### Organizations
- ID, name, type, logo, branches

### Branches
- ID, organization, name, address, phone, location, services, staff

### Services
- ID, branch, name (multi-language), category, duration, priority

### Staff
- ID, branch, name, role, services, counter, status

### Queues
- ID, number, branch, service, staff, status, timestamps, customer info

## 🎯 Queue Statuses

- **waiting** - In queue
- **called** - Customer called
- **serving** - Being served
- **completed** - Service completed
- **cancelled** - Cancelled
- **no-show** - Customer didn't show up

## 🔔 Notifications

- Browser notifications
- Sound alerts
- Voice announcements
- SMS/Email (API integration ready)

## 📈 Analytics

- Total queues
- Average wait time
- Average service time
- Completion rate
- Peak hours analysis
- Staff performance metrics

## 🚀 Getting Started

1. Open `index.html` in a modern web browser
2. The system will automatically initialize with mock data
3. Navigate to different pages to explore features

### Mock Data
The system comes with pre-populated mock data:
- 3 organizations (Bank, Clinic, Passport Service)
- 3 branches
- 9 services
- 7 staff members
- Sample queues

## 🔐 Security Notes

- Input validation and sanitization
- XSS protection
- CSRF tokens ready for backend integration
- Role-based access control

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## 🎨 Customization

### Colors
Edit CSS variables in `css/main.css`:
```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --accent-gradient: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
  /* ... */
}
```

### Languages
Add translations in `js/language.js`:
```javascript
translations: {
  uz: { /* Uzbek */ },
  ru: { /* Russian */ },
  en: { /* English */ }
}
```

## 🔄 Future Enhancements

- [ ] Backend API integration
- [ ] Real SMS/Email notifications
- [ ] OpenAI GPT integration
- [ ] Mobile apps
- [ ] Payment integration
- [ ] Video call support
- [ ] Multi-tenant SaaS platform

## 📄 License

© 2024 Operator AI. All rights reserved.

## 👥 Contact

- 📧 Email: info@operatorai.uz
- 📱 Phone: +998 90 123 45 67
- 📍 Location: Tashkent, Uzbekistan

---

**Built with ❤️ for Uzbekistan** 🇺🇿
