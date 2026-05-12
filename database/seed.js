// crearBaseDeDatos.js
// Banco Nexus - Script de inicialización de base de datos
// Integrante 1: Arquitecto de Base de Datos

const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const clientesData = [
  { nombre: 'Ana Gabriela Ruiz Mendoza',      curp: 'RUMA900101MDFXXX01', telefono: '5551001001', email: 'ana.ruiz@email.com' },
  { nombre: 'Luis Alberto Pérez Torres',       curp: 'PETL850203HDFXXX02', telefono: '5551001002', email: 'luis.perez@email.com' },
  { nombre: 'María Fernanda López García',     curp: 'LOGM920515MDFXXX03', telefono: '5551001003', email: 'mf.lopez@email.com' },
  { nombre: 'Carlos Eduardo Martínez Soto',   curp: 'MASC880714HDFXXX04', telefono: '5551001004', email: 'carlos.martinez@email.com' },
  { nombre: 'Sofía Alejandra Hernández Cruz', curp: 'HECS950320MDFXXX05', telefono: '5551001005', email: 'sofia.hernandez@email.com' },
  { nombre: 'Jorge Antonio Ramírez Vega',     curp: 'RAVJ791108HDFXXX06', telefono: '5551001006', email: 'jorge.ramirez@email.com' },
  { nombre: 'Valentina Torres Jiménez',       curp: 'TOJV010630MDFXXX07', telefono: '5551001007', email: 'valentina.torres@email.com' },
  { nombre: 'Roberto Carlos Díaz Fuentes',    curp: 'DIFR830922HDFXXX08', telefono: '5551001008', email: 'roberto.diaz@email.com' },
  { nombre: 'Paola Itzel Morales Castillo',   curp: 'MOCP961215MDFXXX09', telefono: '5551001009', email: 'paola.morales@email.com' },
  { nombre: 'Alejandro Gutiérrez Navarro',    curp: 'GUNA870417HDFXXX10', telefono: '5551001010', email: 'alejandro.gutierrez@email.com' },
  { nombre: 'Isabella Vargas Reyes',          curp: 'VARI030825MDFXXX11', telefono: '5551001011', email: 'isabella.vargas@email.com' },
  { nombre: 'Miguel Ángel Flores Ortega',     curp: 'FLOM910602HDFXXX12', telefono: '5551001012', email: 'miguel.flores@email.com' },
  { nombre: 'Daniela Ruiz Santana',           curp: 'RUSD000118MDFXXX13', telefono: '5551001013', email: 'daniela.ruiz@email.com' },
  { nombre: 'Eduardo Salinas Bravo',          curp: 'SABE761130HDFXXX14', telefono: '5551001014', email: 'eduardo.salinas@email.com' },
  { nombre: 'Camila Estrada Medina',          curp: 'ESMC040303MDFXXX15', telefono: '5551001015', email: 'camila.estrada@email.com' },
];

function generarNumeroCuenta(index) {
  return String(1000000000 + index).padStart(10, '0');
}

function fechaAleatoria(diasAtras) {
  const hoy = new Date();
  const offset = Math.floor(Math.random() * diasAtras);
  hoy.setDate(hoy.getDate() - offset);
  return hoy;
}

function generarCuentasYTransacciones(clientes) {
  const cuentas = [];
  const transacciones = [];
  clientes.forEach((cliente, i) => {
    const numeroCuenta = generarNumeroCuenta(i + 1);
    const saldoInicial = parseFloat((Math.random() * 45000 + 5000).toFixed(2));
    cuentas.push({
      cuenta: numeroCuenta,
      cliente: cliente.curp,
      tipo: i % 3 === 0 ? 'ahorro' : i % 3 === 1 ? 'corriente' : 'nómina',
      saldo: saldoInicial,
      fechaApertura: fechaAleatoria(730),
      activa: true,
    });
    const numTx = Math.floor(Math.random() * 3) + 3;
    let saldoActual = saldoInicial;
    for (let t = 0; t < numTx; t++) {
      const esDeposito = Math.random() > 0.4;
      const monto = parseFloat((Math.random() * 3000 + 200).toFixed(2));
      saldoActual = esDeposito
        ? parseFloat((saldoActual + monto).toFixed(2))
        : parseFloat((saldoActual - monto).toFixed(2));
      transacciones.push({
        cuenta: numeroCuenta,
        tipo: esDeposito ? 'deposito' : 'retiro',
        monto,
        saldoResultante: saldoActual,
        fecha: fechaAleatoria(180),
        descripcion: esDeposito ? 'Depósito en ventanilla' : 'Retiro en cajero',
      });
    }
  });
  return { cuentas, transacciones };
}

async function crearBD() {
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    const db = client.db('banco_nexus');

    await db.collection('clientes').deleteMany({});
    await db.collection('cuentas').deleteMany({});
    await db.collection('transacciones').deleteMany({});
    console.log('🗑️  Colecciones limpiadas');

    const resClientes = await db.collection('clientes').insertMany(clientesData);
    console.log(`👤 ${resClientes.insertedCount} clientes insertados`);

    const { cuentas, transacciones } = generarCuentasYTransacciones(clientesData);
    const resCuentas = await db.collection('cuentas').insertMany(cuentas);
    console.log(`🏦 ${resCuentas.insertedCount} cuentas insertadas`);

    const resTx = await db.collection('transacciones').insertMany(transacciones);
    console.log(`💳 ${resTx.insertedCount} transacciones insertadas`);

    await db.collection('clientes').createIndex({ curp: 1 }, { unique: true });
    await db.collection('cuentas').createIndex({ cuenta: 1 }, { unique: true });
    await db.collection('cuentas').createIndex({ cliente: 1 });
    await db.collection('transacciones').createIndex({ cuenta: 1 });
    await db.collection('transacciones').createIndex({ fecha: -1 });
    console.log('📑 Índices creados');

    console.log('\n🎉 Base de datos "banco_nexus" inicializada con éxito.');
    console.log('\n── RESUMEN DE CUENTAS ──────────────────────────────');
    cuentas.forEach((c, i) => {
      console.log(`  ${c.cuenta} | ${clientesData[i].nombre.padEnd(38)} | $${c.saldo.toFixed(2)}`);
    });
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada.');
  }
}

crearBD();
