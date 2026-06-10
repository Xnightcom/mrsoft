# MRsoft Nexus

A TanStack Start + React + TypeScript project for the MRsoft website and portal.

## Overview

This project includes:
- Public marketing pages and contact form
- Authentication page with Google sign-in / email sign-in
- Protected dashboard routes
- Supabase integration for auth and data
- SMTP email sending support for contact submissions

## Tech Stack

- React 19
- TypeScript
- TanStack Start / Router
- Vite
- Tailwind CSS
- Supabase
- Nodemailer
- Firebase (optional auth integration path)

## Project Structure

- src/routes/ — page routes
- src/components/ — shared UI components
- src/integrations/ — Supabase, Lovable, Firebase integrations
- src/lib/ — server utilities, config, API helpers
- supabase/ — database migrations and config

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server from the project root:
   ```bash
   node .\node_modules\vite\bin\vite.js dev --host 0.0.0.0
   ```

3. Open the app:
   - Local: http://localhost:8084/

## Environment Variables

Set the required variables in `.env` for:
- Supabase URL and publishable key
- SMTP email settings
- Optional Firebase auth values
- Public base URL for redirects

## Authentication Notes

- Google sign-in is wired through Supabase OAuth and also has a Firebase-based path for local testing.
- Ensure your OAuth redirect URIs match your actual dev URL.

## Contact / Email

The contact page sends submissions through a server-side function using Nodemailer and also stores the request in Supabase.

## Notes

- Vite may choose another port if 8080–8083 are already in use.
- If the browser shows a 404 or auth error, verify the running origin and redirect configuration.
