# Connexerv

> Connecting people with trusted local service providers in Addis Ababa.

**Live Demo:** [connexerv.vercel.app](https://local-service-finder-pied.vercel.app/)  
**GitHub:** [github.com/samrawit04/Connexerv](https://github.com/samrawit04/Connexerv)

---

## What is Connexerv?

Connexerv is a full-stack service marketplace platform built for the local Ethiopian market. It bridges the gap between customers looking for reliable service providers — plumbers, cleaners, tutors, electricians — and skilled professionals looking for work.

Beyond a simple listing platform, Connexerv includes a real-time communication system with text, voice, file sharing, and video calling — making it a complete end-to-end solution for finding, booking, and communicating with service providers.

---

## Features

### Authentication & Users
- JWT-based authentication with role-based access (Customer / Provider)
- Secure password hashing with BCrypt
- Persistent sessions with token storage

### Service Providers
- Providers create and manage their service profiles
- Categorized service listings with descriptions
- Location-based search and filtering

### Job Posting
- Customers post jobs they need done
- Providers browse and apply for jobs that match their skills
- Full application management flow

### Booking System
- Customers book services directly from provider profiles
- Providers accept or reject booking requests
- Booking status tracking (Pending / Accepted / Rejected)

### Reviews & Ratings
- Customers leave reviews after completed bookings
- Star ratings visible on provider profiles
- Review system tied to verified bookings only

### Notifications
- Real-time notifications for booking updates, job applications, and messages
- Notification center with read/unread status

### Real-Time Chat
- Text messaging between customers and providers
- Voice message recording and playback
- File and image attachments
- Voice calls
- Video calls
- Powered by SignalR

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React + TypeScript | UI framework |
| Vite | Build tool |
| React Router | Client-side routing |
| Axios | API communication |
| Cloudinary | File and media storage |

### Backend
| Technology | Purpose |
|------------|---------|
| ASP.NET Core | Web API framework |
| Entity Framework Core | ORM / database access |
| PostgreSQL | Relational database |
| SignalR | Real-time communication |
| JWT | Authentication |
| BCrypt | Password hashing |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend deployment |
| Render | Backend deployment |
| Neon | Managed PostgreSQL database |
| Cloudinary | Media storage |

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   React Frontend    │ ──────► │  ASP.NET Core API    │
│   (Vercel)          │ ◄────── │  (Render)            │
└─────────────────────┘         └──────────┬───────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │  PostgreSQL (Neon)   │
                                └──────────────────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │  Cloudinary          │
                                │  (Media Storage)     │
                                └──────────────────────┘
```

---

## Database Models

- **User** — authentication, roles
- **ServiceProvider** — provider profile linked to user
- **Service** — individual service listings by providers
- **Booking** — customer-provider booking transactions
- **Review** — post-booking ratings and comments
- **JobPost** — customer job requests
- **JobApplication** — provider applications to job posts
- **Notification** — system and user notifications
- **ChatMessage** — real-time messages with media support

---

## Getting Started

### Prerequisites
- Node.js 18+
- .NET 10 SDK
- PostgreSQL (or Neon account)

### Clone the repository
```bash
git clone https://github.com/samrawit04/Connexerv.git
cd Connexerv
```

### Backend setup
```bash
cd backend
```

Create `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "your_postgresql_connection_string"
  },
  "Jwt": {
    "Key": "your_secret_key_min_32_characters",
    "Issuer": "Connexerv",
    "Audience": "ConnexervUsers"
  }
}
```

Run migrations and start:
```bash
dotnet ef database update
dotnet run
```

### Frontend setup
```bash
cd frontend
npm install
```

Create `.env`:
```
VITE_API_URL=http://localhost:5202/api
```

Start:
```bash
npm run dev
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/Auth/register` | Register new user |
| POST | `/api/Auth/login` | Login and get JWT |

### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/Providers` | List all providers |
| GET | `/api/Providers/{id}` | Get provider details |
| POST | `/api/Providers` | Create provider profile |
| PUT | `/api/Providers/{id}` | Update provider profile |

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/Services` | List all services |
| POST | `/api/Services` | Create a service listing |
| PUT | `/api/Services/{id}` | Update a service |
| DELETE | `/api/Services/{id}` | Delete a service |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/Bookings` | Create a booking |
| GET | `/api/Bookings/my` | Get my bookings |
| PUT | `/api/Bookings/{id}/status` | Accept or reject booking |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/Reviews` | Leave a review |
| GET | `/api/Reviews/{providerId}` | Get provider reviews |

---

## Roadmap

- [ ] Map integration — show providers on Addis Ababa map
- [ ] Chapa payment integration (Ethiopian payment gateway)
- [ ] Mobile app (React Native)
- [ ] Provider analytics dashboard
- [ ] Admin panel for platform management

---

## Author

**Samrawit Amare**  
Full-Stack Developer  
[LinkedIn](https://www.linkedin.com/in/samrawitamare/) • [GitHub](https://github.com/samrawit04)
