# 💰 Personal Finance Tracker (Full Stack)

A modern web application to track personal expenses, built with **Python (FastAPI)** and **React**. This project demonstrates a full-cycle **CRUD** operation system with a relational database integration.

## 🚀 Features

- **Create:** Add new expenses with amount, category, and date.
- **Read:** View all transaction history in a dynamic table.
- **Update:** Edit existing records with a pre-filled form (State Reuse).
- **Delete:** Remove unwanted records from the database.
- **Database:** Real-time data persistence using PostgreSQL.
- **CORS:** Secure communication between Frontend (Port 5173) and Backend (Port 8000).

## 🛠️ Tech Stack

### Backend

- **Language:** Python 3.x
- **Framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Validation:** Pydantic

### Frontend

- **Library:** React.js (Vite)
- **Styling:** CSS3
- **HTTP Client:** Fetch API

## ⚙️ Installation

### 1. Backend Setup

```bash
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary
uvicorn main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Developed by Minel Didir
