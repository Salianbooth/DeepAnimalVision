# DeepAnimalVision

DeepAnimalVision is a full-stack image detection system built with `Vue 3 + Django + YOLO`.
It provides a complete workflow for:

- user registration/login
- image upload and object detection
- canvas visualization with zoom/pan/highlight
- detection history playback
- admin-side user management and system overview

The project is suitable for coursework, graduation projects, and AI application demos.

## Features

### User-side

- Upload images and run detection (`/api/detect/`)
- Draw detection boxes on Canvas (with confidence labels)
- Zoom, drag, reset canvas view
- Click detection list to highlight boxes
- Save rendered image and export JSON result
- View/delete history records and clear all history

### Admin-side

- Dashboard summary (`/api/admin/overview/`)
- View all users (`/api/admin/users/`)
- Create user (`/api/admin/users/create/`)
- Update user role (`/api/admin/users/<id>/role/`)
- Delete user (`/api/admin/users/<id>/delete/`)
- Reset user password (`/api/admin/users/<id>/password/`)

## Tech Stack

- Frontend: `Vue 3`, `TypeScript`, `Vite`, `Pinia`, `Axios`
- Backend: `Django 4.2`, `SQLite`, `PyTorch`, `Ultralytics YOLO`, `OpenCV`

## Project Structure

```text
DeepAnimalVision/
├── frontend/                  # Vue 3 frontend
│   ├── src/
│   │   ├── views/
│   │   │   ├── login/         # login/register
│   │   │   ├── user/          # user workspace
│   │   │   └── admin/         # admin dashboard
│   │   ├── api/               # frontend API wrappers
│   │   ├── store/             # Pinia stores
│   │   └── components/        # shared components
│   └── package.json
├── backend/
│   └── server/
│       ├── api/               # detection/auth/admin APIs
│       ├── users/             # custom user model
│       ├── recognition/       # YOLO inference logic
│       ├── media/             # uploaded images
│       ├── db.sqlite3
│       └── manage.py
├── requirements.txt
└── README.md
```

## Quick Start

## 1) Backend

Prerequisites:

- Python 3.9+ (recommended 3.10/3.11)
- `pip`

Install dependencies:

```bash
cd backend/server
python -m venv .venv
.venv\Scripts\activate
pip install -r ..\..\requirements.txt
```

Run migrations:

```bash
python manage.py migrate
```

Start backend:

```bash
python manage.py runserver
```

Backend default URL: `http://127.0.0.1:8000`

## 2) Frontend

Prerequisites:

- Node.js 18+ (recommended 20+)
- npm

Install and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://127.0.0.1:5173`

## 3) Login and Roles

- Register a normal user from `/register`
- Login page automatically redirects:
  - `role=user` -> `/user`
  - `role=admin` -> `/admin`

Note:

- Admin APIs require an authenticated admin session.
- Role checks are enforced in backend and frontend route guards.

## API Overview

Auth:

- `POST /api/register/`
- `POST /api/login/`

Detection & history:

- `POST /api/detect/`
- `GET /api/records/`
- `GET /api/records/<record_id>/`
- `DELETE /api/records/<record_id>/delete/`
- `DELETE /api/records/clear/`

Admin:

- `GET /api/admin/overview/`
- `GET /api/admin/users/`
- `POST /api/admin/users/create/`
- `PATCH /api/admin/users/<user_id>/role/`
- `DELETE /api/admin/users/<user_id>/delete/`
- `PATCH /api/admin/users/<user_id>/password/`

## Troubleshooting

PowerShell blocks `npm` scripts:

Use:

```bash
npm.cmd run dev
```

instead of:

```bash
npm run dev
```

Vite/TS config weird import errors:

- Ensure there are no stale compiled files in `frontend/src` (like `*.js`, `*.vue.js`)
- Keep only source files (`.ts`, `.vue`)

Small laptop screen shows clipped UI:

- This project now supports vertical scrolling on both user and admin pages.
- If cached styles remain, restart dev server and hard refresh browser.

## Current Status

Implemented:

- full user detection flow
- history replay and deletion
- admin dashboard and user management
- responsive layout for laptop and external monitor switching

Recommended next iteration:

- add unit/integration tests for admin APIs
- add operation audit logs (who changed role/password)
- add account enable/disable control

## License

This repository is for learning and research purposes.
