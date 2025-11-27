# Dashboard Guide

## Overview

The Wheely dashboard provides a comprehensive overview of your car rental business with an intuitive, responsive interface that supports both English and Albanian languages.

## Features

### 🎯 Dashboard Header

- **Logo & Branding**: Wheely logo with quick navigation
- **Language Toggle**: Switch between English (EN) and Albanian (AL) instantly
- **User Menu**: 
  - User profile with avatar
  - Quick access to Dashboard and Bookings
  - Logout functionality
- **Responsive Navigation**: Adapts perfectly to mobile, tablet, and desktop screens

### 📊 Statistics Cards

The dashboard displays four key metrics:

1. **Total Bookings**
   - Shows total number of all bookings
   - Displays percentage change vs last month
   
2. **Active Rentals**
   - Shows currently active rentals (picked up status)
   - Real-time count of ongoing rentals
   
3. **Total Revenue**
   - Displays total revenue from all bookings
   - Shows current month's revenue
   
4. **Pending Approvals**
   - Shows bookings awaiting confirmation
   - Helps prioritize actions needed

### 📋 Recent Bookings

- **Desktop View**: Full table with all booking details
- **Mobile View**: Card-based layout optimized for small screens
- **Quick Access**: View the 5 most recent bookings
- **Link to All Bookings**: Quick navigation to see full booking list

### 🎨 Quick Actions

Two action cards for quick navigation:

1. **Bookings Management**
   - View total bookings count
   - Direct link to bookings page
   
2. **Analytics** (Coming Soon)
   - Placeholder for future analytics features

## Language Support

### Switching Languages

Click the language toggle button in the header to switch between:
- **English (EN)**: Default language
- **Albanian (AL)**: Shqip

Your language preference is saved in browser storage and persists across sessions.

### Supported Languages

All UI elements are fully translated:
- Navigation menus
- Statistics labels
- Button text
- Status indicators
- Date formatting

## Responsive Design

The dashboard is fully responsive and optimized for:

### 📱 Mobile (< 768px)
- Stacked stats cards (1 column)
- Card-based booking list
- Hamburger menu navigation
- Touch-optimized buttons

### 📱 Tablet (768px - 1024px)
- 2-column stats layout
- Simplified table view
- Optimized spacing

### 🖥️ Desktop (> 1024px)
- 4-column stats layout
- Full table with all columns
- Expanded navigation
- Maximum information density

## Navigation

### Header Navigation

- **Dashboard**: Overview with stats and recent bookings
- **Bookings**: Full booking management system

### User Menu Options

- **Dashboard**: Return to overview
- **Bookings**: Manage all bookings
- **Logout**: Sign out securely

## Security

### Authentication

- All dashboard pages require authentication
- Unauthenticated users are redirected to login
- Session management via Supabase Auth

### Logout

The logout button:
- Securely signs out the user
- Clears session data
- Redirects to login page
- Shows loading state during logout

## Data

Currently using dummy data for development. The dashboard displays:
- 8 sample bookings
- Various booking statuses
- Realistic car and customer data
- Sample revenue calculations

**Note**: When connected to Supabase database, the dashboard will display real-time data.

## Styling

### Design System

- **Primary Color**: Blue-900 (#1e3a8a)
- **Font**: System font stack for best performance
- **Shadows**: Subtle elevation for depth
- **Borders**: Soft grays for clean separation
- **Hover States**: Interactive feedback on all clickable elements

### Status Colors

- **Pending**: Orange
- **Confirmed**: Blue
- **Picked Up**: Green
- **Returned**: Gray
- **Cancelled**: Red

## Performance

### Optimizations

- **Client Components**: Only where needed (language context, interactivity)
- **Server Components**: Default for better performance
- **Image Optimization**: Next.js Image component with Unsplash integration
- **Code Splitting**: Automatic via Next.js
- **Lazy Loading**: Images and components load on demand

## Accessibility

- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Where needed for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus states

## Browser Support

Tested and optimized for:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Planned features:
- Analytics dashboard with charts
- Car management section
- Profile settings
- Notifications system
- Dark mode
- Export reports
- Advanced filtering
- Real-time updates via Supabase subscriptions

## Troubleshooting

### Language not switching
- Check browser console for errors
- Clear localStorage and refresh
- Ensure JavaScript is enabled

### Stats showing incorrect data
- Currently using dummy data
- Will be accurate once connected to Supabase

### Images not loading
- Check `next.config.js` has Unsplash in remotePatterns
- Verify internet connection
- Check browser console for CORS errors

### Logout not working
- Check Supabase connection
- Verify `.env.local` has correct credentials
- Check browser console for errors

## Support

For issues or questions:
1. Check the console for error messages
2. Review the Supabase Setup Guide
3. Verify environment variables
4. Check that dev server is running

## Development

### Local Development

```bash
npm run dev
```

Navigate to `http://localhost:3000/dashboard`

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```


