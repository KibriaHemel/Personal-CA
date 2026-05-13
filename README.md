# Personal CA v2

A static, browser-runnable front-end prototype for **Personal CA**, a free tax assistant for Bangladesh, India and the USA.

## How to run

Open `index.html` in any modern browser.

No installation is required.

## New login/registration behavior

- Login requires **username + password**.
- Registration requires:
  - Full name
  - Occupation
  - Username
  - Email
  - Password
  - Confirm password
- After successful login or registration, the user is taken to a full-screen profile dashboard.

## Profile dashboard includes

- Overview
- Saved tax reports
- Account details
- Privacy and security information
- Delete saved reports
- Download/print PDF report

## Important production note

This is a static front-end prototype. It uses browser localStorage and a client-side SHA-256 hash only for demo purposes. For a real public product, use a secure backend such as Supabase Auth + PostgreSQL Row Level Security, backend tax calculations, server-side PDF generation and encrypted storage.
