# GramConnect Database Setup Guide (Cloud PostgreSQL)

GramConnect uses PostgreSQL (`gramconnect_db` locally, or a managed cloud PostgreSQL database in production).

## Free Cloud PostgreSQL Providers (Recommended):
1. **Neon** ([neon.tech](https://neon.tech)) – Free tier with instant setup and connection pooling.
2. **Render PostgreSQL** ([render.com](https://render.com)) – Managed PostgreSQL directly on Render.
3. **Supabase** ([supabase.com](https://supabase.com)) – Free managed PostgreSQL.

---

## How to Set Up with Neon (Recommended):

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project** (Name: `gramconnect-db`).
3. Under **Dashboard > Connection Details**, copy the connection details.
   - You will see:
     - `Host`: e.g. `ep-restless-pond-123456.us-east-2.aws.neon.tech`
     - `Database`: `neondb`
     - `Username`: `neondb_owner`
     - `Password`: `[your-password]`
4. Click on **SQL Editor** in Neon:
   - Copy the contents of [`schema.sql`](./schema.sql) and click **Run**.
   - (Optional) Copy and run [`sample_data.sql`](./sample_data.sql) if you want initial starter data.
5. In Render (when deploying the backend), set these 3 environment variables:
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<neon-host>/neondb?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME`: `<neon-username>`
   - `SPRING_DATASOURCE_PASSWORD`: `<neon-password>`
