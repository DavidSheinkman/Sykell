# Sykell - David Cheinkman - Test submission

---

## Tech Stack

- Frontend: React, Vite, TanStack Table, React Router, Recharts  
- Backend: Go, Gin, MySQL, Docker
- Testing: Jest, React Testing Library  

---

## Setup

### Backend

1. Ensure [Docker](https://www.docker.com/products/docker-desktop) is installed and running.

2. From the project root, run:

```bash
docker-compose up --build
````

By default, backend listens on `localhost:8080`.

---

### Frontend

1. Navigate to frontend directory:

```bash
cd frontend
cd vite-frontend
```

2. Install dependencies:

```bash
npm i
```

3. Run frontend dev server:

```bash
npm run dev
```

## API Endpoints

| Method | Endpoint               | Description                |
| ------ | ---------------------- | -------------------------- |
| GET    | `/api/urls`            | List all URLs              |
| POST   | `/api/urls`            | Add new URL to crawl       |
| POST   | `/api/urls/:id/start`  | Start crawling URL by ID   |
| GET    | `/api/urls/:id/status` | Get crawl status & results |
| DELETE | `/api/urls/:id/delete` | Delete URL by ID           |

All requests require `Authorization: Bearer supersecrettoken` header.

---

## Project Structure

```
/backend          # Go backend source
    /internal
        /crawler
        /handlers
        /middleware
/frontend
    /vite-frontend         # React frontend source
        /src
            /components
            /pages    


schema.sql        # Database schema
```

---

## Contact

David Cheinkman
Email: davidsheinkman7@gmail.com

