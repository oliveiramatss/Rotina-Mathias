const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Criar tabela se não existir
(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS atividades (
      id SERIAL PRIMARY KEY,
      texto TEXT,
      data_inicio TIMESTAMP,
      data_fim TIMESTAMP,
      tipo TEXT,
      categoria TEXT
    )`);
    console.log("Tabela verificada/criada no Postgres!");
  } catch (err) {
    console.error("Erro ao criar tabela:", err);
  }
})();

// ==== ROTAS ====

// Listar atividades com cálculo de tempo de sono (em horas:minutos)
app.get('/atividades', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *,
        CASE 
          WHEN data_inicio IS NOT NULL AND data_fim IS NOT NULL THEN 
            TO_CHAR(data_fim - data_inicio, 'HH24:MI')
          ELSE NULL
        END AS duracao
      FROM atividades
      ORDER BY data_inicio DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inserir atividade
app.post('/atividades', async (req, res) => {
  const { texto, data_inicio, data_fim, tipo, categoria } = req.body;

  if (!texto || !data_inicio) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO atividades (texto, data_inicio, data_fim, tipo, categoria)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [texto, data_inicio, data_fim || null, tipo || null, categoria || null]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar atividade
app.put('/atividades/:id', async (req, res) => {
  const { texto, data_inicio, data_fim, tipo, categoria } = req.body;

  try {
    const result = await pool.query(
      `UPDATE atividades SET texto=$1, data_inicio=$2, data_fim=$3, tipo=$4, categoria=$5
       WHERE id=$6`,
      [texto, data_inicio, data_fim, tipo, categoria, req.params.id]
    );
    res.json({ updated: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar atividade
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

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
