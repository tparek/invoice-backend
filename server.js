const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// SQLite DB setup
const dbPath = path.join(__dirname, 'invoices.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number INTEGER NOT NULL,
    date TEXT NOT NULL,
    payment_term TEXT NOT NULL,
    client_company_name TEXT NOT NULL,
    client_address TEXT NOT NULL,
    client_reg_nr TEXT,
    client_kmkr_nr TEXT,
    services TEXT NOT NULL, -- JSON string
    subtotal REAL NOT NULL,
    vat REAL NOT NULL,
    total REAL NOT NULL
  )`);
});

// Helper: Get next invoice number
function getNextInvoiceNumber(callback) {
  db.get('SELECT MAX(invoice_number) as maxNum FROM invoices', (err, row) => {
    if (err) return callback(182); // fallback
    const nextNum = row && row.maxNum ? row.maxNum + 1 : 182;
    callback(nextNum);
  });
}

// POST /invoices - create new invoice
app.post('/invoices', (req, res) => {
  getNextInvoiceNumber((invoice_number) => {
    const {
      date,
      payment_term,
      client_company_name,
      client_address,
      client_reg_nr,
      client_kmkr_nr,
      services,
      subtotal,
      vat,
      total
    } = req.body;
    db.run(
      `INSERT INTO invoices (invoice_number, date, payment_term, client_company_name, client_address, client_reg_nr, client_kmkr_nr, services, subtotal, vat, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_number,
        date,
        payment_term,
        client_company_name,
        client_address,
        client_reg_nr,
        client_kmkr_nr,
        JSON.stringify(services),
        subtotal,
        vat,
        total
      ],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json({ id: this.lastID, invoice_number });
        }
      }
    );
  });
});

// GET /invoices - list all invoices
app.get('/invoices', (req, res) => {
  db.all('SELECT * FROM invoices ORDER BY invoice_number DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // Parse services JSON
      rows.forEach(row => row.services = JSON.parse(row.services));
      res.json(rows);
    }
  });
});

// GET /invoices/:id - get single invoice
app.get('/invoices/:id', (req, res) => {
  db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Invoice not found' });
    } else {
      row.services = JSON.parse(row.services);
      res.json(row);
    }
  });
});

// TEMPORARY: Delete all invoices endpoint
app.delete('/clear-invoices', (req, res) => {
  db.run('DELETE FROM invoices', [], function(err) {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.send({ message: 'All invoices deleted.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 