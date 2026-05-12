// server.js
// Banco Nexus - API REST con Express + MongoDB (usando db.js modular)
// Integrante 2: Programador Backend

const express = require('express');
const cors = require('cors');
const { conectar, getDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Middleware: verificar que la BD está lista
app.use((req, res, next) => {
  try { getDB(); next(); }
  catch { res.status(503).json({ error: 'Base de datos no disponible' }); }
});

// ─── RUTAS ───────────────────────────────────────────────────────────────────

// GET /health
app.get('/health', (req, res) => {
  res.json({ estado: 'OK', timestamp: new Date() });
});

// GET /api/clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const db = getDB();
    const clientes = await db.collection('clientes').find({}).toArray();
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/cuenta/:cuenta
// Devuelve datos del cliente, saldo y últimas 10 transacciones
app.get('/api/cuenta/:cuenta', async (req, res) => {
  try {
    const db = getDB();
    const { cuenta } = req.params;

    const cuentaDoc = await db.collection('cuentas').findOne({ cuenta });
    if (!cuentaDoc) return res.status(404).json({ error: 'Cuenta no encontrada' });

    const clienteDoc = await db.collection('clientes').findOne({ curp: cuentaDoc.cliente });

    const transacciones = await db
      .collection('transacciones')
      .find({ cuenta })
      .sort({ fecha: -1 })
      .limit(10)
      .toArray();

    res.json({
      cuenta: cuentaDoc.cuenta,
      tipo: cuentaDoc.tipo,
      saldo: cuentaDoc.saldo,
      fechaApertura: cuentaDoc.fechaApertura,
      activa: cuentaDoc.activa,
      cliente: {
        nombre: clienteDoc?.nombre || 'Desconocido',
        curp: clienteDoc?.curp,
        email: clienteDoc?.email,
        telefono: clienteDoc?.telefono,
      },
      transacciones,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/historial/:cuenta
// Todas las transacciones ordenadas por fecha (para gráfica de evolución)
app.get('/api/historial/:cuenta', async (req, res) => {
  try {
    const db = getDB();
    const { cuenta } = req.params;

    const cuentaDoc = await db.collection('cuentas').findOne({ cuenta });
    if (!cuentaDoc) return res.status(404).json({ error: 'Cuenta no encontrada' });

    const historial = await db
      .collection('transacciones')
      .find({ cuenta })
      .sort({ fecha: 1 })
      .toArray();

    res.json(historial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/deposito
// Body: { cuenta, monto, descripcion? }
app.post('/api/deposito', async (req, res) => {
  try {
    const db = getDB();
    const { cuenta, monto, descripcion } = req.body;

    if (!cuenta || monto === undefined) return res.status(400).json({ error: 'Faltan campos: cuenta y monto son requeridos' });
    if (typeof monto !== 'number' || monto <= 0) return res.status(400).json({ error: 'El monto debe ser un número positivo' });

    const cuentaDoc = await db.collection('cuentas').findOne({ cuenta });
    if (!cuentaDoc) return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (!cuentaDoc.activa) return res.status(403).json({ error: 'La cuenta está inactiva' });

    const nuevoSaldo = parseFloat((cuentaDoc.saldo + monto).toFixed(2));

    await db.collection('cuentas').updateOne({ cuenta }, { $set: { saldo: nuevoSaldo } });

    const tx = {
      cuenta,
      tipo: 'deposito',
      monto: parseFloat(monto.toFixed(2)),
      saldoResultante: nuevoSaldo,
      fecha: new Date(),
      descripcion: descripcion || 'Depósito',
    };
    await db.collection('transacciones').insertOne(tx);

    res.json({ mensaje: 'Depósito realizado con éxito', saldoAnterior: cuentaDoc.saldo, montoDepositado: monto, nuevoSaldo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/retiro
// Body: { cuenta, monto, descripcion? }
app.post('/api/retiro', async (req, res) => {
  try {
    const db = getDB();
    const { cuenta, monto, descripcion } = req.body;

    if (!cuenta || monto === undefined) return res.status(400).json({ error: 'Faltan campos: cuenta y monto son requeridos' });
    if (typeof monto !== 'number' || monto <= 0) return res.status(400).json({ error: 'El monto debe ser un número positivo' });

    const cuentaDoc = await db.collection('cuentas').findOne({ cuenta });
    if (!cuentaDoc) return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (!cuentaDoc.activa) return res.status(403).json({ error: 'La cuenta está inactiva' });
    if (cuentaDoc.saldo < monto) return res.status(400).json({ error: 'Saldo insuficiente' });

    const nuevoSaldo = parseFloat((cuentaDoc.saldo - monto).toFixed(2));

    await db.collection('cuentas').updateOne({ cuenta }, { $set: { saldo: nuevoSaldo } });

    const tx = {
      cuenta,
      tipo: 'retiro',
      monto: parseFloat(monto.toFixed(2)),
      saldoResultante: nuevoSaldo,
      fecha: new Date(),
      descripcion: descripcion || 'Retiro en cajero',
    };
    await db.collection('transacciones').insertOne(tx);

    res.json({ mensaje: 'Retiro realizado con éxito', saldoAnterior: cuentaDoc.saldo, montoRetirado: monto, nuevoSaldo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── INICIO ──────────────────────────────────────────────────────────────────

conectar().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Banco Nexus en http://localhost:${PORT}`);
    console.log('── RUTAS ──────────────────────────────────────');
    console.log('  GET  /health');
    console.log('  GET  /api/clientes');
    console.log('  GET  /api/cuenta/:cuenta');
    console.log('  GET  /api/historial/:cuenta');
    console.log('  POST /api/deposito');
    console.log('  POST /api/retiro');
  });
}).catch(err => {
  console.error('❌ No se pudo conectar a MongoDB:', err.message);
  process.exit(1);
});
