const db = require('../../config/database');

module.exports = {
  obtenerMenu: async (req, res) => {
    try {
      const client = await db.pool.connect();
      try {
        // Obtenemos categorias
        const resultCat = await client.query('SELECT * FROM categorias');
        // Obtenemos productos
        const resultProd = await client.query('SELECT * FROM productos WHERE activo = TRUE');
        // Obtenemos presentaciones
        const resultPres = await client.query('SELECT * FROM presentaciones');
        // Obtenemos paquetes
        const resultPaq = await client.query('SELECT * FROM paquetes WHERE activo = TRUE');
        
        res.status(200).json({
          categorias: resultCat.rows,
          productos: resultProd.rows,
          presentaciones: resultPres.rows,
          paquetes: resultPaq.rows
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
};
