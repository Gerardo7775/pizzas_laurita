-- ============================================================
-- MIGRACIÓN: Agregar columna requiere_receta a categorias
-- Fecha: 2026-06-19
-- Descripción: Permite marcar por categoría si sus productos
--              requieren configuración de receta (BOM).
-- ============================================================

-- 1. Agregar la columna (con default false para no romper datos existentes)
ALTER TABLE categorias 
  ADD COLUMN IF NOT EXISTS requiere_receta BOOLEAN NOT NULL DEFAULT false;

-- 2. Migrar dato existente: la categoría "Pizza" ya requería receta
UPDATE categorias SET requiere_receta = true WHERE LOWER(nombre) = 'pizza';

-- 3. Verificar
SELECT id, nombre, requiere_receta FROM categorias ORDER BY id;
