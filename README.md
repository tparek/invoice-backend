# Invoice Generator Backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node server.js
   ```

The server will run on [http://localhost:4000](http://localhost:4000).

## API Endpoints

- `POST /invoices` — Create a new invoice
- `GET /invoices` — List all invoices
- `GET /invoices/:id` — Get a single invoice by ID

The database file (`invoices.db`) will be created automatically in the backend directory. 