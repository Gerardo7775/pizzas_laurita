-- ================================================================
-- MIGRACIÓN: Vincular presentaciones con la tabla tamanos
-- Ejecutar este script UNA SOLA VEZ en PostgreSQL
-- ================================================================

-- 1. Agregar la columna tamano_id a presentaciones (si no existe)
ALTER TABLE presentaciones
  ADD COLUMN IF NOT EXISTS tamano_id INTEGER;

-- 2. Agregar la restricción de llave foránea (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_presentaciones_tamano'
      AND table_name = 'presentaciones'
  ) THEN
    ALTER TABLE presentaciones
      ADD CONSTRAINT fk_presentaciones_tamano
      FOREIGN KEY (tamano_id) REFERENCES tamanos(id) ON DELETE RESTRICT;
  END IF;
END$$;

-- 3. Ya que la tabla antigua no tenía campo individual de nombre para el tamaño,
--    forzamos a todas las presentaciones existentes a adoptar el "Tamaño 1" temporalmente.
--    Podrás corregir esto visualmente desde el panel del Backoffice si lo requieren.
UPDATE presentaciones
SET tamano_id = (SELECT id FROM tamanos ORDER BY id LIMIT 1)
WHERE tamano_id IS NULL;

-- 4. Una vez todos tienen valor, hacer la columna requerida (NOT NULL)
ALTER TABLE presentaciones
  ALTER COLUMN tamano_id SET NOT NULL;

-- 5. Verificar el resultado
SELECT 
  pr.id,
  pr.producto_id,
  t.nombre AS tamano,
  pr.precio,
  pr.tamano_id
FROM presentaciones pr
LEFT JOIN tamanos t ON pr.tamano_id = t.id
ORDER BY pr.id;
