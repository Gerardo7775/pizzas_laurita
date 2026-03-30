/**
 * Controlador de Pedidos
 * Capa de Interfaces
 * 
 * Se encarga exclusivamente de mapear (req, res) e invocar
 * a la capa de Aplicación (Servicios).
 */

module.exports = {
  crearPedido: async (req, res) => {
    try {
      const payload = req.body;
      
      // Aquí se inyectarían los casos de uso / servicios
      // const ticketCerrado = await prepararPedidoUseCase(payload);

      res.status(201).json({ mensaje: 'Pedido recibido' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
