GRAMCONNECT - SMART VILLAGE PROBLEM SOLVER
==========================================

WHERE TO PLACE THIS ZIP
1. Open File Explorer.
2. Go to: C:\Users\ADMIN\projects\
3. Make a backup of your current Gramconnect folder first.
4. Extract this ZIP into C:\Users\ADMIN\projects\
5. It will create a folder named GramConnect_Starter.
6. Open that extracted folder in VS Code to inspect the starter project.

IMPORTANT:
- This ZIP is a starter scaffold, not the finished production application.
- It includes a working React/Vite frontend shell and a Spring Boot backend starter.
- It does not overwrite your existing Gramconnect folder.
- Keep your existing project until you have checked this starter.
- PostgreSQL must be installed and running before connecting the backend.
- Do not put the ZIP inside src or pages. Extract it as a normal project folder.

FRONTEND
Open Command Prompt (CMD), then:
  cd /d C:\Users\ADMIN\projects\GramConnect_Starter\frontend
  npm install
  npm run dev

Open the URL shown by Vite (usually http://localhost:5173).

BACKEND
Requirements: JDK 21 and Maven installed.
Open a second CMD window:
  cd /d C:\Users\ADMIN\projects\GramConnect_Starter\backend
  mvn spring-boot:run

If Maven is not installed/configured, do not continue yet; tell ChatGPT the exact error.

DATABASE
Create a PostgreSQL database named:
  gramconnect_db

Backend configuration is in:
  backend\src\main\resources\application.properties

Default local development settings use database username postgres and password CHANGE_ME.
Change these to your actual PostgreSQL credentials before starting the backend.

This starter currently includes:
- React + TypeScript + Vite frontend
- React Router
- Public pages and role dashboard placeholders
- Spring Boot REST API health endpoint and complaint starter endpoints
- PostgreSQL configuration template
- A simple complaint entity/repository/controller scaffold

Authentication, JWT security, image uploads, maps, real notifications, and full admin/worker workflows still need to be implemented and tested. Do not present this starter as a finished secure system.
