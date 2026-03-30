/**
 * Controlador de Pedidos
 * Capa de Interfaces
 * 
 * Se encarga exclusivamente de mapear (req, res) e invocar
 * a la capa de Aplicación (Servicios).
 */

const { prepararPedidoUseCase } = require('../../application/services/pedido.service');

module.exports = {
  crearPedido: async (req, res) => {
    try {
      const payload = req.body;
      const io = req.app.get('socketio');
      
      const exito = await prepararPedidoUseCase(payload, io);

      res.status(201).json({ mensaje: 'Pedido recibido y guardado con exito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
};
