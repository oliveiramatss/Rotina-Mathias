const express = require('express');
const { Pool } = require('pg'); // Postgres
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Banco Postgres (Render fornece a DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Render exige SSL
});

// Criar tabela se não existir
(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS atividades (
      id SERIAL PRIMARY KEY,
      texto TEXT,
      data TEXT,
      tipo TEXT,
      categoria TEXT
    )`);
    console.log("Tabela verificada/criada no Postgres!");
  } catch (err) {
    console.error("Erro ao criar tabela:", err);
  }
})();

// ==== ROTAS ====
app.get('/atividades', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM atividades ORDER BY data DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/atividades', async (req, res) => {
  const { texto, data, tipo, categoria } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO atividades (texto, data, tipo, categoria) VALUES ($1, $2, $3, $4) RETURNING id`,
      [texto, data, tipo, categoria]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/atividades/:id', async (req, res) => {
  const { texto, data, tipo, categoria } = req.body;
  try {
    const result = await pool.query(
      `UPDATE atividades SET texto=$1, data=$2, tipo=$3, categoria=$4 WHERE id=$5`,
      [texto, data, tipo, categoria, req.params.id]
    );
    res.json({ updated: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/atividades/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM atividades WHERE id=$1`,
      [req.params.id]
    );
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
