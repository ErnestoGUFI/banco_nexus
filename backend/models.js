class Client {
  constructor({ nombre, curp, telefono, email }) {
    this.nombre = nombre;
    this.curp = curp;
    this.telefono = telefono;
    this.email = email;
  }
}

class Account {
  constructor({ cuenta, cliente, tipo, saldo, fechaApertura, activa = true }) {
    this.cuenta = cuenta;
    this.cliente = cliente;
    this.tipo = tipo;
    this.saldo = saldo;
    this.fechaApertura = fechaApertura;
    this.activa = activa;
  }
}

class Transaction {
  constructor({ cuenta, tipo, monto, saldoResultante, fecha, descripcion }) {
    this.cuenta = cuenta;
    this.tipo = tipo;
    this.monto = monto;
    this.saldoResultante = saldoResultante;
    this.fecha = fecha;
    this.descripcion = descripcion;
  }
}

module.exports = {
  Client,
  Account,
  Transaction,
};
