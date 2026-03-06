# Leave Management System

Monorepo for an HR platform with:
- Employee/Admin portal
- Candidate portal
- Recruitment and Learning modules
- Workforce operations

## Project Structure
- `client/` React + Vite frontend
- `server/` Node.js + Express + MongoDB backend

Each folder has its own setup and environment instructions:
- [Client README](./client/README.md)
- [Server README](./server/README.md)

## Quick Start
1. Start backend (see `server/README.md`).
2. Start frontend (see `client/README.md`).
3. Open `http://localhost:5173`.

## Main Routes
- Employee Login: `/login`
- Candidate Careers: `/careers`
- Candidate Login: `/candidate/login`
- Candidate Register: `/candidate/register`

## Notes
- Authentication now uses cookie-based access and refresh tokens for employee/admin flows.
- Role/designation-based access is enforced in both backend routes and frontend navigation.
