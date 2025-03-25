# Planner Buddy

A comprehensive task and appointment management system with email reminders via Gmail.

## Features

- Todo management with filtering, sorting, and search capabilities
- Appointment calendar with day, week, and month views
- Email reminders via Gmail for upcoming tasks and appointments
- User account management with timezone support
- System settings for administrators
- Responsive UI built with Bootstrap 5

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL with Sequelize ORM
- **Frontend**: EJS templates, Bootstrap 5, jQuery
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer with Gmail API

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/planner-buddy.git
   cd planner-buddy
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=planner_buddy
   DB_DIALECT=mysql

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=1d

   # Gmail API Configuration
   GMAIL_CLIENT_ID=your_gmail_client_id
   GMAIL_CLIENT_SECRET=your_gmail_client_secret
   GMAIL_REDIRECT_URI=http://localhost:3000/auth/google/callback
   GMAIL_REFRESH_TOKEN=your_gmail_refresh_token

   # AI Configuration
   AI_MASTER_PROMPT="This is a todo and appointment management application that uses Gmail for reminders."
   ```

4. Initialize the database:
   ```
   npm run init-db
   ```

5. Start the application:
   ```
   npm start
   ```

   For development with automatic restart:
   ```
   npm run dev
   ```

## Application Structure

```
├── assets/                  # Static assets
│   ├── css/                 # CSS files
│   └── js/                  # JavaScript files
├── controllers/             # Request handlers
├── database/                # Database related files
│   ├── migrations/          # Database migrations
│   └── models/              # Sequelize models
├── routes/                  # Express routes
├── services/                # Business logic
├── utils/                   # Utility functions
├── views/                   # EJS templates
│   ├── partials/            # Reusable view components
│   ├── auth/                # Authentication pages
│   ├── todos/               # Todo management pages
│   ├── appointments/        # Appointment pages
│   └── settings/            # Settings pages
├── .env                     # Environment variables
├── server.js                # Application entry point
└── package.json             # Project dependencies
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Todos
- `GET /todos` - Get all todos for current user
- `GET /todos/:id` - Get a todo by ID
- `POST /todos` - Create a new todo
- `PUT /todos/:id` - Update a todo
- `DELETE /todos/:id` - Delete a todo
- `PATCH /todos/:id/complete` - Mark todo as completed/incomplete

### Appointments
- `GET /appointments` - Get all appointments for current user
- `GET /appointments/day` - Get appointments for a specific day
- `GET /appointments/week` - Get appointments for a specific week
- `GET /appointments/month` - Get appointments for a specific month
- `GET /appointments/:id` - Get an appointment by ID
- `POST /appointments` - Create a new appointment
- `PUT /appointments/:id` - Update an appointment
- `DELETE /appointments/:id` - Delete an appointment

### Settings
- `GET /settings` - Get all settings
- `GET /settings/:key` - Get a setting by key
- `PUT /settings/:key` - Update a setting
- `DELETE /settings/:key` - Delete a setting

## Default User

After running the database initialization script, a default admin user will be created:

- Email: admin@example.com
- Password: admin123

## License

MIT