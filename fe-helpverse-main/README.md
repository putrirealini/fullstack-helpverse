# HelpVerse

HelpVerse is an event ticketing platform that enables event organizers to create and publish events, as well as allowing users to purchase event tickets online.

## 📋 Table of Contents

- [About the Application](#about-the-application)
- [Key Features](#key-features)
- [Installation Guide](#installation-guide)
- [Application Usage](#application-usage)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Advanced Development](#advanced-development)
- [License](#license)

## 📌 About the Application

HelpVerse is a comprehensive event ticketing platform that enables:
- **Event Organizers** to create and manage events
- **Users** to search for, book, and purchase event tickets
- **Admins** to manage the entire platform

This application is designed to provide a seamless experience in managing and attending various types of events.

## ✨ Key Features

### User Management
- Registration with 3 roles: User, Event Organizer, and Admin
- Login/Logout with JWT authentication
- User profiles with ticket purchase history

### Event Management
- Search and filter events by date, location, and tags
- Detailed event pages with comprehensive information
- Event image galleries

### Ticket System
- Various ticket types with different pricing
- Seat selection based on venue layout
- Discount and promo code implementation

### Booking Process
- Event ticket booking
- Waiting list system for events with limited tickets
- Booking and payment management

## 💻 Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/) (recommended)
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/helpverse.git
   cd helpverse
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```
   
   Or using npm:
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and adjust to your required configuration.

4. **Run the application in development mode**
   ```bash
   pnpm dev
   ```
   
   Or if you want to run with CORS proxy:
   ```bash
   pnpm dev:cors
   ```

5. **Build for production**
   ```bash
   pnpm build
   ```

6. **Run the production application**
   ```bash
   pnpm start
   ```

## 🚀 Application Usage

### For General Users
1. **Register/Login** to the application
2. **Search for events** you want to attend
3. **Select tickets** you desire
4. **Book and pay** to get your tickets
5. **View tickets** on the "My Bookings" page

### For Event Organizers
1. **Register as an Event Organizer** via `/register/event-organizer`
2. **Login** to the application
3. **Create a new event** via `/event/create`
4. **Manage events** you have created
5. **Monitor ticket sales** and statistics

### Waiting List Feature
1. If an event is sold out, users can **join the waiting list**
2. Users will **receive notifications** when tickets become available
3. Users can **cancel** their waiting list registration on the "My Waiting List" page

## 🛠️ Tech Stack

### Frontend
- React with React Router
- TypeScript
- Tailwind CSS
- Axios for HTTP requests

### Development Tools
- Vite as the build tool
- ESLint and TypeScript for type checking

## 📁 Project Structure

```
helpverse/
├── app/                  # Application source code
│   ├── components/       # Reusable React components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Main application pages
│   ├── routes/           # Route components
│   ├── services/         # Services for API calls
│   └── utils/            # Utility functions
├── public/               # Static assets
├── .react-router/        # React Router configuration
├── node_modules/         # Dependencies
└── ...                   # Other configuration files
```

## 🔧 Advanced Development

### Running Tests
```bash
pnpm test
```

### Type Checking
```bash
pnpm typecheck
```

### CORS Proxy Configuration
If you encounter CORS issues during development, use:
```bash
pnpm proxy
```

## 📄 License

[MIT License](LICENSE)
