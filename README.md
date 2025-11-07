# PetCare - Pet Management Application

A full-stack web application for managing pet care, including to-do lists, appointments, health records, and multi-user collaboration.

## Features

- **Pet Profile Management**: Create and manage multiple pet profiles with detailed information
- **To-Do Lists**: Daily task management with reminders, assignments, and repeat options
- **Appointments**: Schedule and track vet visits, grooming, and other appointments with notifications
- **Health Records**: Maintain medical history, vaccination schedules, and upload documents
- **Multi-User Support**: Pet owners can share access with caregivers via unique pet codes
- **Connected Members**: View all members connected through your pets
- **Group Members**: Manage owners and caregivers for each pet

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **File Upload**: Multer
- **PDF Generation**: jsPDF, html2canvas

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pet-care-app-main
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Start the server:
```bash
npm start
# or
node server.js
```

The server will run on `http://localhost:3000`

### Database

The SQLite database (`pet_care.db`) will be created automatically on first run. The schema includes:
- Users
- Pets
- Groups and Group Members
- To-Do Lists
- Appointments
- Health Records
- Vaccine Schedules

## Project Structure

```
pet-care-app-main/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── uploads/         # User-uploaded files
│   └── server.js        # Main server file
├── public/              # Frontend files
│   ├── *.html          # Page templates
│   ├── *.js            # Frontend JavaScript
│   └── *.css           # Stylesheets
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `PUT /api/username` - Update username
- `POST /api/change-password` - Change password

### Pets
- `POST /api/pets/create` - Create a new pet
- `GET /api/pets/user` - Get user's pets
- `GET /api/pets/caretaker` - Get pets user cares for
- `GET /api/pets/code/:petCode` - Get pet by code
- `GET /api/pets/:petId` - Get pet by ID
- `PUT /api/pets/:petId` - Update pet

### Caregivers
- `POST /api/caregiver/add` - Add caregiver to pet
- `DELETE /api/caregiver/remove` - Remove caregiver
- `POST /api/caregiver/migrate` - Migrate caregivers from localStorage

### Members
- `GET /api/connected-members` - Get all connected members
- `GET /api/pet/:petId/members` - Get group members for a pet

### To-Do Lists
- `GET /api/todos/:petId` - Get todos for a pet
- `POST /api/todos` - Create a todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo

### Appointments
- `GET /api/appointments/:petId` - Get appointments for a pet
- `POST /api/appointments` - Create an appointment
- `PUT /api/appointments/:id` - Update an appointment
- `DELETE /api/appointments/:id` - Delete an appointment

### Health Records
- `GET /api/health-records/:petId` - Get health records
- `POST /api/health-records` - Create a health record (with file upload)
- `DELETE /api/health-records/:id` - Delete a health record

### Vaccines
- `GET /api/vaccines/:petId` - Get vaccine schedule
- `PUT /api/vaccines/:vaccineId` - Update vaccine status

## Usage

1. **Sign Up**: Create a new account with first name, last name, email, and password
2. **Select Role**: Choose "Pet Owner" or "Caregiver"
3. **Pet Owners**: Create pet profiles and share pet codes with caregivers
4. **Caregivers**: Enter pet codes to access pet profiles
5. **Manage**: Use to-do lists, appointments, and health records for each pet

## Development

### Making Changes

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and test them

3. Commit your changes:
```bash
git add .
git commit -m "Description of your changes"
```

4. Push to GitHub:
```bash
git push origin feature/your-feature-name
```

5. Create a Pull Request on GitHub for review

### Best Practices

- Always test changes locally before pushing
- Write clear commit messages
- Create branches for new features
- Don't commit database files or node_modules
- Keep sensitive data out of the repository

## License

[Add your license here]

## Contributors

[Add contributor names here]
