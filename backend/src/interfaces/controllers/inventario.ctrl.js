const db = require('../../config/database');

module.exports = {
  obtenerAlertasInventario: async (req, res) => {
    try {
      const client = await db.pool.connect();
      try {
        const query = 'SELECT * FROM ingredientes WHERE stock_actual <= stock_minimo';
        const result = await client.query(query);
        res.status(200).json(result.rows);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
};
