-- ============================================================
-- 🍕 PIZZAS LAURITA — SCRIPT DE DATOS DE PRUEBA COMPLETO
-- ============================================================
-- Ejecutar en pgAdmin o psql contra la base "pizzas_laurita"
-- Orden: respeta las dependencias de llaves foráneas.
--
-- ⚠️  Si ya tienes datos, descomenta la sección de LIMPIEZA
--     al inicio para empezar desde cero.
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  SECCIÓN 0: LIMPIEZA (descomenta si quieres borrar todo) │
-- └──────────────────────────────────────────────────────────┘
-- TRUNCATE detalle_pedido, seguimiento_estados, pedidos,
--          contenido_paquete, paquetes,
--          recetas, presentaciones, productos,
--          ingredientes, categorias, tamanos,
--          usuarios
-- CASCADE;

-- ============================================================
-- 1. CATEGORÍAS
-- ============================================================
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Pizza',   'Pizzas artesanales con masa hecha en casa'),
  ('Bebida',  'Refrescos, aguas y jugos'),
  ('Postre',  'Postres y complementos dulces'),
  ('Snack',   'Entradas y bocadillos rápidos')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- 2. TAMAÑOS
-- ============================================================
INSERT INTO tamanos (nombre) VALUES
  ('Personal'),
  ('Mediana'),
  ('Grande'),
  ('Familiar'),
  ('2 litros'),
  ('600ml'),
  ('Porción'),
  ('Rebanada')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- 3. INGREDIENTES (Inventario completo de la pizzería)
-- ============================================================
INSERT INTO ingredientes (nombre, unidad_receta, stock_actual, stock_minimo, costo_unitario, unidad_compra, factor_conversion) VALUES
  -- Bases y masas
  ('Tortilla Familiar',         'pza',  25.00,   5.00,   8.00, 'Pza',   1.00),
  ('Tortilla Grande',           'pza',  20.00,   5.00,   6.50, 'Pza',   1.00),
  ('Tortilla Mediana',          'pza',  15.00,   5.00,   5.00, 'Pza',   1.00),
  ('Tortilla Personal',         'pza',  30.00,  10.00,   3.50, 'Pza',   1.00),
  -- Quesos
  ('Barra de Queso Chihuahua',  'gr', 4400.00, 2000.00, 230.00, 'Barra', 2200.00),
  ('Barra de Queso Chilchota',  'gr', 4400.00, 2000.00, 240.00, 'Barra', 2200.00),
  -- Salsas
  ('Pure de Tomate',            'ml', 2000.00,  500.00,  22.00, 'Caja',  1000.00),
  -- Carnes y embutidos
  ('Jamón',                     'gr', 3600.00,  800.00, 380.00, 'Barra', 1800.00),
  ('Pepperoni',                 'gr', 1500.00,  400.00, 120.00, 'Bolsa',  500.00),
  ('Salchicha Italiana',        'gr', 1000.00,  300.00,  95.00, 'Bolsa',  500.00),
  ('Tocino',                    'gr',  800.00,  300.00, 150.00, 'Paquete', 400.00),
  ('Pollo Desmenuzado',         'gr', 1200.00,  400.00, 180.00, 'Bolsa',  600.00),
  -- Vegetales
  ('Piña',                      'gr', 2000.00,  500.00,  35.00, 'Pza',  1000.00),
  ('Champiñón Rebanado',        'gr',  800.00,  200.00,  55.00, 'Lata',   400.00),
  ('Pimiento Morrón',           'gr',  600.00,  200.00,  25.00, 'Pza',   200.00),
  ('Cebolla',                   'gr', 1000.00,  300.00,  12.00, 'Pza',   250.00),
  ('Jalapeño',                  'gr',  500.00,  150.00,  15.00, 'Bolsa',  250.00),
  ('Aceitunas',                 'gr',  400.00,  100.00,  45.00, 'Lata',   200.00),
  -- Empaque
  ('Caja Familiar',             'pza',  50.00,  10.00,  12.00, 'Pza',   1.00),
  ('Caja Grande',               'pza',  60.00,  10.00,  10.00, 'Pza',   1.00),
  ('Caja Mediana',              'pza',  50.00,  10.00,   8.00, 'Pza',   1.00),
  -- Bebidas
  ('Coca-Cola 2L',              'pza',  24.00,   6.00,  28.00, 'Pza',   1.00),
  ('Coca-Cola 600ml',           'pza',  36.00,  12.00,  15.00, 'Pza',   1.00),
  ('Fanta 2L',                  'pza',  12.00,   4.00,  26.00, 'Pza',   1.00),
  ('Sprite 2L',                 'pza',  12.00,   4.00,  26.00, 'Pza',   1.00),
  ('Agua Natural 600ml',        'pza',  24.00,   6.00,   8.00, 'Pza',   1.00)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. PRODUCTOS (el menú de la pizzería)
-- ============================================================
-- Primero obtenemos los IDs de las categorías
DO $$
DECLARE
  cat_pizza  INT;
  cat_bebida INT;
  cat_postre INT;
  cat_snack  INT;
BEGIN
  SELECT id INTO cat_pizza  FROM categorias WHERE nombre = 'Pizza';
  SELECT id INTO cat_bebida FROM categorias WHERE nombre = 'Bebida';
  SELECT id INTO cat_postre FROM categorias WHERE nombre = 'Postre';
  SELECT id INTO cat_snack  FROM categorias WHERE nombre = 'Snack';

  -- Pizzas
  INSERT INTO productos (categoria_id, nombre, descripcion, activo, es_mitad_mitad) VALUES
    (cat_pizza, 'Pizza Hawaiana',       'Jamón y piña con doble queso',                     true, false),
    (cat_pizza, 'Pizza Pepperoni',      'Clásica de pepperoni con orégano',                  true, false),
    (cat_pizza, 'Pizza Mexicana',       'Jalapeño, chorizo, cebolla y pimiento',             true, false),
    (cat_pizza, 'Pizza Carnes Frías',   'Jamón, pepperoni, salchicha y tocino',              true, false),
    (cat_pizza, 'Pizza Vegetariana',    'Champiñón, pimiento, cebolla, aceitunas',           true, false),
    (cat_pizza, 'Pizza BBQ Pollo',      'Pollo desmenuzado con salsa BBQ y cebolla',         true, false),
    (cat_pizza, 'Pizza Mitad y Mitad',  'Elige dos sabores en una sola pizza',               true, true)
  ON CONFLICT DO NOTHING;

  -- Bebidas
  INSERT INTO productos (categoria_id, nombre, descripcion, activo, es_mitad_mitad) VALUES
    (cat_bebida, 'Coca-Cola',        'Refresco de cola',      true, false),
    (cat_bebida, 'Fanta',            'Refresco de naranja',   true, false),
    (cat_bebida, 'Sprite',           'Refresco de lima-limón', true, false),
    (cat_bebida, 'Agua Natural',     'Agua purificada',       true, false)
  ON CONFLICT DO NOTHING;

  -- Postres
  INSERT INTO productos (categoria_id, nombre, descripcion, activo, es_mitad_mitad) VALUES
    (cat_postre, 'Brownie',          'Brownie de chocolate con nuez',  true, false)
  ON CONFLICT DO NOTHING;

  -- Snacks
  INSERT INTO productos (categoria_id, nombre, descripcion, activo, es_mitad_mitad) VALUES
    (cat_snack, 'Dedos de Queso',    'Palitos de queso mozzarella empanizados',  true, false)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- 5. PRESENTACIONES (tamaños y precios por producto)
-- ============================================================
DO $$
DECLARE
  -- Tamaños
  tam_personal  INT;
  tam_mediana   INT;
  tam_grande    INT;
  tam_familiar  INT;
  tam_2litros   INT;
  tam_600ml     INT;
  tam_porcion   INT;
  -- Productos
  prod_id       INT;
BEGIN
  SELECT id INTO tam_personal FROM tamanos WHERE nombre = 'Personal';
  SELECT id INTO tam_mediana  FROM tamanos WHERE nombre = 'Mediana';
  SELECT id INTO tam_grande   FROM tamanos WHERE nombre = 'Grande';
  SELECT id INTO tam_familiar FROM tamanos WHERE nombre = 'Familiar';
  SELECT id INTO tam_2litros  FROM tamanos WHERE nombre = '2 litros';
  SELECT id INTO tam_600ml    FROM tamanos WHERE nombre = '600ml';
  SELECT id INTO tam_porcion  FROM tamanos WHERE nombre = 'Porción';

  -- === PIZZAS: 4 tamaños cada una ===
  FOR prod_id IN (
    SELECT p.id FROM productos p
    JOIN categorias c ON p.categoria_id = c.id
    WHERE c.nombre = 'Pizza' AND p.es_mitad_mitad = false
  ) LOOP
    INSERT INTO presentaciones (producto_id, tamano_id, precio) VALUES
      (prod_id, tam_personal,  99.00),
      (prod_id, tam_mediana,  149.00),
      (prod_id, tam_grande,   199.00),
      (prod_id, tam_familiar, 249.00)
    ON CONFLICT (producto_id, tamano_id) DO NOTHING;
  END LOOP;

  -- Pizza Mitad y Mitad (solo Grande y Familiar)
  SELECT id INTO prod_id FROM productos WHERE nombre = 'Pizza Mitad y Mitad';
  IF prod_id IS NOT NULL THEN
    INSERT INTO presentaciones (producto_id, tamano_id, precio) VALUES
      (prod_id, tam_grande,   209.00),
      (prod_id, tam_familiar, 259.00)
    ON CONFLICT (producto_id, tamano_id) DO NOTHING;
  END IF;

  -- === BEBIDAS ===
  -- Coca-Cola
  SELECT id INTO prod_id FROM productos WHERE nombre = 'Coca-Cola';
  IF prod_id IS NOT NULL THEN
    INSERT INTO presentaciones (producto_id, tamano_id, precio) VALUES
      (prod_id, tam_2litros, 45.00),
      (prod_id, tam_600ml,   25.00)
    ON CONFLICT (producto_id, tamano_id) DO NOTHING;
  END IF;

  -- Fanta
  SELECT id INTO prod_id FROM productos WHERE nombre = 'Fanta';
  IF prod_id IS NOT NULL THEN
    INSERT INTO presentaciones (producto_id, tamano_id, precio) VALUES
      (prod_id, tam_2litros, 42.00)
    ON CONFLICT (producto_id, tamano_id) DO NOTHING;
  END IF;

  -- Sprite
  SELECT id INTO prod_id FROM productos WHERE nombre = 'Sprite';
  IF prod_id IS NOT NULL THEN
    INSERT INTO presentaciones (producto_id, tamano_id, precio) VALUES
      (prod_id, tam_2litros, 42.00)
    ON CONFLICT (producto_id, tamano_id) DO NOTHING;
  END IF;

  -- Agua Natural
  SELECT id INTO prod_id FROM productos WHERE nombre = 'Agua Natural';
  IF prod_id IS NOT NULL THEN
    INSERT INTO presentaciones (producto_id, tamano_id, precio) VALUES
      (prod_id, tam_600ml, 18.00)
    ON CONFLICT (producto_id, tamano_id) DO NOTHING;
  END IF;

  -- Brownie (porción)
  SELECT id INTO prod_id FROM productos WHERE nombre = 'Brownie';
  IF prod_id IS NOT NULL THEN
    INSERT INTO presentaciones (producto_id, tamano_id, precio) VALUES
      (prod_id, tam_porcion, 35.00)
    ON CONFLICT (producto_id, tamano_id) DO NOTHING;
  END IF;

  -- Dedos de Queso (porción)
  SELECT id INTO prod_id FROM productos WHERE nombre = 'Dedos de Queso';
  IF prod_id IS NOT NULL THEN
    INSERT INTO presentaciones (producto_id, tamano_id, precio) VALUES
      (prod_id, tam_porcion, 55.00)
    ON CONFLICT (producto_id, tamano_id) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- 6. RECETAS (Bill of Materials — ingredientes por presentación)
-- ============================================================
DO $$
DECLARE
  -- IDs de ingredientes
  ing_tortilla_fam   INT;
  ing_tortilla_gde   INT;
  ing_tortilla_med   INT;
  ing_tortilla_per   INT;
  ing_queso_chih     INT;
  ing_queso_chil     INT;
  ing_pure           INT;
  ing_jamon          INT;
  ing_pepperoni      INT;
  ing_salchicha      INT;
  ing_tocino         INT;
  ing_pollo          INT;
  ing_pina           INT;
  ing_champi         INT;
  ing_pimiento       INT;
  ing_cebolla        INT;
  ing_jalapeno       INT;
  ing_aceitunas      INT;
  ing_caja_fam       INT;
  ing_caja_gde       INT;
  ing_caja_med       INT;
  -- Tamaños
  tam_personal       INT;
  tam_mediana        INT;
  tam_grande         INT;
  tam_familiar       INT;
  -- Presentación temporal
  pres_id            INT;
BEGIN
  -- Buscar ingredientes
  SELECT id INTO ing_tortilla_fam FROM ingredientes WHERE nombre ILIKE 'Tortilla Familiar%' LIMIT 1;
  SELECT id INTO ing_tortilla_gde FROM ingredientes WHERE nombre ILIKE 'Tortilla Grande%'   LIMIT 1;
  SELECT id INTO ing_tortilla_med FROM ingredientes WHERE nombre ILIKE 'Tortilla Mediana%'  LIMIT 1;
  SELECT id INTO ing_tortilla_per FROM ingredientes WHERE nombre ILIKE 'Tortilla Personal%' LIMIT 1;
  SELECT id INTO ing_queso_chih  FROM ingredientes WHERE nombre ILIKE '%Chihuahua%'         LIMIT 1;
  SELECT id INTO ing_queso_chil  FROM ingredientes WHERE nombre ILIKE '%Chilchota%'         LIMIT 1;
  SELECT id INTO ing_pure        FROM ingredientes WHERE nombre ILIKE 'Pure%'               LIMIT 1;
  SELECT id INTO ing_jamon       FROM ingredientes WHERE nombre ILIKE 'Jam_n%'              LIMIT 1;
  SELECT id INTO ing_pepperoni   FROM ingredientes WHERE nombre ILIKE 'Pepperoni%'          LIMIT 1;
  SELECT id INTO ing_salchicha   FROM ingredientes WHERE nombre ILIKE 'Salchicha%'          LIMIT 1;
  SELECT id INTO ing_tocino      FROM ingredientes WHERE nombre ILIKE 'Tocino%'             LIMIT 1;
  SELECT id INTO ing_pollo       FROM ingredientes WHERE nombre ILIKE 'Pollo%'              LIMIT 1;
  SELECT id INTO ing_pina        FROM ingredientes WHERE nombre ILIKE 'Pi_a'                LIMIT 1;
  SELECT id INTO ing_champi      FROM ingredientes WHERE nombre ILIKE 'Champi%'             LIMIT 1;
  SELECT id INTO ing_pimiento    FROM ingredientes WHERE nombre ILIKE 'Pimiento%'           LIMIT 1;
  SELECT id INTO ing_cebolla     FROM ingredientes WHERE nombre ILIKE 'Cebolla%'            LIMIT 1;
  SELECT id INTO ing_jalapeno    FROM ingredientes WHERE nombre ILIKE 'Jalape%'             LIMIT 1;
  SELECT id INTO ing_aceitunas   FROM ingredientes WHERE nombre ILIKE 'Aceitunas%'          LIMIT 1;
  SELECT id INTO ing_caja_fam    FROM ingredientes WHERE nombre ILIKE 'Caja Familiar%'      LIMIT 1;
  SELECT id INTO ing_caja_gde    FROM ingredientes WHERE nombre ILIKE 'Caja Grande%'        LIMIT 1;
  SELECT id INTO ing_caja_med    FROM ingredientes WHERE nombre ILIKE 'Caja Mediana%'       LIMIT 1;

  SELECT id INTO tam_personal FROM tamanos WHERE nombre = 'Personal';
  SELECT id INTO tam_mediana  FROM tamanos WHERE nombre = 'Mediana';
  SELECT id INTO tam_grande   FROM tamanos WHERE nombre = 'Grande';
  SELECT id INTO tam_familiar FROM tamanos WHERE nombre = 'Familiar';

  -- ─── PIZZA HAWAIANA ───
  -- Familiar
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza Hawaiana' AND pr.tamano_id = tam_familiar;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_fam, 1),
      (pres_id, ing_queso_chih,   150),
      (pres_id, ing_queso_chil,   150),
      (pres_id, ing_pure,         70),
      (pres_id, ing_jamon,        80),
      (pres_id, ing_pina,         70),
      (pres_id, ing_caja_fam,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;

  -- Grande
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza Hawaiana' AND pr.tamano_id = tam_grande;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_gde, 1),
      (pres_id, ing_queso_chih,   120),
      (pres_id, ing_queso_chil,   120),
      (pres_id, ing_pure,         60),
      (pres_id, ing_jamon,        60),
      (pres_id, ing_pina,         60),
      (pres_id, ing_caja_gde,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;

  -- Mediana
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza Hawaiana' AND pr.tamano_id = tam_mediana;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_med, 1),
      (pres_id, ing_queso_chih,   90),
      (pres_id, ing_queso_chil,   90),
      (pres_id, ing_pure,         45),
      (pres_id, ing_jamon,        50),
      (pres_id, ing_pina,         45),
      (pres_id, ing_caja_med,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;

  -- ─── PIZZA PEPPERONI ───
  -- Familiar
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza Pepperoni' AND pr.tamano_id = tam_familiar;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_fam, 1),
      (pres_id, ing_queso_chih,   150),
      (pres_id, ing_queso_chil,   150),
      (pres_id, ing_pure,         70),
      (pres_id, ing_pepperoni,    80),
      (pres_id, ing_caja_fam,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;

  -- Grande
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza Pepperoni' AND pr.tamano_id = tam_grande;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_gde, 1),
      (pres_id, ing_queso_chih,   120),
      (pres_id, ing_queso_chil,   120),
      (pres_id, ing_pure,         60),
      (pres_id, ing_pepperoni,    60),
      (pres_id, ing_caja_gde,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;

  -- ─── PIZZA MEXICANA ───
  -- Familiar
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza Mexicana' AND pr.tamano_id = tam_familiar;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_fam, 1),
      (pres_id, ing_queso_chih,   150),
      (pres_id, ing_queso_chil,   150),
      (pres_id, ing_pure,         70),
      (pres_id, ing_jalapeno,     40),
      (pres_id, ing_cebolla,      40),
      (pres_id, ing_pimiento,     40),
      (pres_id, ing_caja_fam,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;

  -- Grande
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza Mexicana' AND pr.tamano_id = tam_grande;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_gde, 1),
      (pres_id, ing_queso_chih,   120),
      (pres_id, ing_queso_chil,   120),
      (pres_id, ing_pure,         60),
      (pres_id, ing_jalapeno,     30),
      (pres_id, ing_cebolla,      30),
      (pres_id, ing_pimiento,     30),
      (pres_id, ing_caja_gde,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;

  -- ─── PIZZA CARNES FRÍAS ───
  -- Familiar
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza Carnes Frías' AND pr.tamano_id = tam_familiar;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_fam, 1),
      (pres_id, ing_queso_chih,   150),
      (pres_id, ing_queso_chil,   150),
      (pres_id, ing_pure,         70),
      (pres_id, ing_jamon,        50),
      (pres_id, ing_pepperoni,    50),
      (pres_id, ing_salchicha,    50),
      (pres_id, ing_tocino,       40),
      (pres_id, ing_caja_fam,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;

  -- ─── PIZZA VEGETARIANA ───
  -- Familiar
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza Vegetariana' AND pr.tamano_id = tam_familiar;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_fam, 1),
      (pres_id, ing_queso_chih,   150),
      (pres_id, ing_queso_chil,   150),
      (pres_id, ing_pure,         70),
      (pres_id, ing_champi,       50),
      (pres_id, ing_pimiento,     40),
      (pres_id, ing_cebolla,      40),
      (pres_id, ing_aceitunas,    30),
      (pres_id, ing_caja_fam,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;

  -- ─── PIZZA BBQ POLLO ───
  -- Familiar
  SELECT pr.id INTO pres_id FROM presentaciones pr JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Pizza BBQ Pollo' AND pr.tamano_id = tam_familiar;
  IF pres_id IS NOT NULL THEN
    INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
      (pres_id, ing_tortilla_fam, 1),
      (pres_id, ing_queso_chih,   150),
      (pres_id, ing_queso_chil,   150),
      (pres_id, ing_pure,         70),
      (pres_id, ing_pollo,        100),
      (pres_id, ing_cebolla,      30),
      (pres_id, ing_caja_fam,     1)
    ON CONFLICT (presentacion_id, ingrediente_id) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- 7. PAQUETES (Combos / Promociones)
-- ============================================================
INSERT INTO paquetes (nombre, descripcion, precio_paquete, activo) VALUES
  ('Combo Individual',   '1 pizza personal + 1 refresco 600ml',                      115.00, true),
  ('Combo Pareja',       '1 pizza grande + 1 refresco 2L',                           229.00, true),
  ('Combo Familiar',     '2 pizzas familiares + 2 refrescos 2L',                     520.00, true),
  ('Combo Fiesta',       '3 pizzas familiares + 3 refrescos 2L + dedos de queso',    799.00, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. CONTENIDO DE PAQUETES (qué incluye cada combo)
-- ============================================================
DO $$
DECLARE
  paq_individual INT;
  paq_pareja     INT;
  paq_familiar   INT;
  paq_fiesta     INT;
  cat_pizza      INT;
  cat_bebida     INT;
  tam_personal   INT;
  tam_grande     INT;
  tam_familiar   INT;
  tam_2litros    INT;
  tam_600ml      INT;
  pres_dedos     INT;
BEGIN
  SELECT id INTO paq_individual FROM paquetes WHERE nombre = 'Combo Individual';
  SELECT id INTO paq_pareja     FROM paquetes WHERE nombre = 'Combo Pareja';
  SELECT id INTO paq_familiar   FROM paquetes WHERE nombre = 'Combo Familiar';
  SELECT id INTO paq_fiesta     FROM paquetes WHERE nombre = 'Combo Fiesta';

  SELECT id INTO cat_pizza  FROM categorias WHERE nombre = 'Pizza';
  SELECT id INTO cat_bebida FROM categorias WHERE nombre = 'Bebida';

  SELECT id INTO tam_personal FROM tamanos WHERE nombre = 'Personal';
  SELECT id INTO tam_grande   FROM tamanos WHERE nombre = 'Grande';
  SELECT id INTO tam_familiar FROM tamanos WHERE nombre = 'Familiar';
  SELECT id INTO tam_2litros  FROM tamanos WHERE nombre = '2 litros';
  SELECT id INTO tam_600ml    FROM tamanos WHERE nombre = '600ml';

  -- Presentación de Dedos de Queso
  SELECT pr.id INTO pres_dedos FROM presentaciones pr
    JOIN productos p ON pr.producto_id = p.id
    WHERE p.nombre = 'Dedos de Queso' LIMIT 1;

  -- Combo Individual: 1 pizza personal (comodín) + 1 bebida 600ml (comodín)
  IF paq_individual IS NOT NULL THEN
    INSERT INTO contenido_paquete (paquete_id, categoria_id, tamano_id, cantidad) VALUES
      (paq_individual, cat_pizza,  tam_personal, 1),
      (paq_individual, cat_bebida, tam_600ml,    1);
  END IF;

  -- Combo Pareja: 1 pizza grande (comodín) + 1 bebida 2L (comodín)
  IF paq_pareja IS NOT NULL THEN
    INSERT INTO contenido_paquete (paquete_id, categoria_id, tamano_id, cantidad) VALUES
      (paq_pareja, cat_pizza,  tam_grande,  1),
      (paq_pareja, cat_bebida, tam_2litros, 1);
  END IF;

  -- Combo Familiar: 2 pizzas familiares (comodín) + 2 bebidas 2L (comodín)
  IF paq_familiar IS NOT NULL THEN
    INSERT INTO contenido_paquete (paquete_id, categoria_id, tamano_id, cantidad) VALUES
      (paq_familiar, cat_pizza,  tam_familiar, 1),
      (paq_familiar, cat_pizza,  tam_familiar, 1),
      (paq_familiar, cat_bebida, tam_2litros,  1),
      (paq_familiar, cat_bebida, tam_2litros,  1);
  END IF;

  -- Combo Fiesta: 3 pizzas familiares + 3 bebidas 2L + dedos de queso
  IF paq_fiesta IS NOT NULL THEN
    INSERT INTO contenido_paquete (paquete_id, categoria_id, tamano_id, cantidad) VALUES
      (paq_fiesta, cat_pizza,  tam_familiar, 1),
      (paq_fiesta, cat_pizza,  tam_familiar, 1),
      (paq_fiesta, cat_pizza,  tam_familiar, 1),
      (paq_fiesta, cat_bebida, tam_2litros,  1),
      (paq_fiesta, cat_bebida, tam_2litros,  1),
      (paq_fiesta, cat_bebida, tam_2litros,  1);

    -- Dedos de queso como producto fijo
    IF pres_dedos IS NOT NULL THEN
      INSERT INTO contenido_paquete (paquete_id, presentacion_id, cantidad) VALUES
        (paq_fiesta, pres_dedos, 1);
    END IF;
  END IF;
END $$;

-- ============================================================
-- 9. PEDIDOS DE PRUEBA (historial simulado del día)
-- ============================================================
DO $$
DECLARE
  ped1 INT;
  ped2 INT;
  ped3 INT;
  ped4 INT;
  ped5 INT;
  pres_haw_fam INT;
  pres_pep_gde INT;
  pres_mex_fam INT;
  pres_car_fam INT;
  pres_veg_fam INT;
  pres_bbq_gde INT;
  pres_coca_2l INT;
  pres_coca_6  INT;
  pres_fanta   INT;
  pres_agua    INT;
  pres_dedos   INT;
  paq_pareja   INT;
  det_combo    INT;
  tam_familiar INT;
  tam_grande   INT;
  tam_2litros  INT;
  tam_600ml    INT;
BEGIN
  SELECT id INTO tam_familiar FROM tamanos WHERE nombre = 'Familiar';
  SELECT id INTO tam_grande   FROM tamanos WHERE nombre = 'Grande';
  SELECT id INTO tam_2litros  FROM tamanos WHERE nombre = '2 litros';
  SELECT id INTO tam_600ml    FROM tamanos WHERE nombre = '600ml';

  -- Buscar presentaciones
  SELECT pr.id INTO pres_haw_fam FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Pizza Hawaiana'     AND pr.tamano_id=tam_familiar;
  SELECT pr.id INTO pres_pep_gde FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Pizza Pepperoni'    AND pr.tamano_id=tam_grande;
  SELECT pr.id INTO pres_mex_fam FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Pizza Mexicana'     AND pr.tamano_id=tam_familiar;
  SELECT pr.id INTO pres_car_fam FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Pizza Carnes Frías' AND pr.tamano_id=tam_familiar;
  SELECT pr.id INTO pres_veg_fam FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Pizza Vegetariana'  AND pr.tamano_id=tam_familiar;
  SELECT pr.id INTO pres_bbq_gde FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Pizza BBQ Pollo'    AND pr.tamano_id=tam_grande;
  SELECT pr.id INTO pres_coca_2l FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Coca-Cola'          AND pr.tamano_id=tam_2litros;
  SELECT pr.id INTO pres_coca_6  FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Coca-Cola'          AND pr.tamano_id=tam_600ml;
  SELECT pr.id INTO pres_fanta   FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Fanta'              AND pr.tamano_id=tam_2litros;
  SELECT pr.id INTO pres_agua    FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Agua Natural'       AND pr.tamano_id=tam_600ml;
  SELECT pr.id INTO pres_dedos   FROM presentaciones pr JOIN productos p ON pr.producto_id=p.id WHERE p.nombre='Dedos de Queso';

  SELECT id INTO paq_pareja FROM paquetes WHERE nombre = 'Combo Pareja';

  -- ─── PEDIDO 1: Pizza hawaiana familiar + Coca 2L (entregado) ───
  INSERT INTO pedidos (folio, cliente_nombre, cliente_telefono, tipo_entrega, estado, tiempo_estimado_min, total, fecha_creacion)
  VALUES ('PED-SEED-001', 'Juan Pérez', '6141234567', 'LOCAL', 'ENTREGADO', 20, 294.00, NOW() - INTERVAL '3 hours')
  RETURNING id INTO ped1;

  INSERT INTO detalle_pedido (pedido_id, presentacion_id, cantidad, precio_unitario, subtotal) VALUES
    (ped1, pres_haw_fam, 1, 249.00, 249.00),
    (ped1, pres_coca_2l, 1,  45.00,  45.00);

  INSERT INTO seguimiento_estados (pedido_id, estado_registrado, fecha_hora) VALUES
    (ped1, 'PENDIENTE',     NOW() - INTERVAL '3 hours'),
    (ped1, 'PREPARANDO',    NOW() - INTERVAL '2 hours 50 min'),
    (ped1, 'HORNEANDO',     NOW() - INTERVAL '2 hours 40 min'),
    (ped1, 'LISTO_ENTREGA', NOW() - INTERVAL '2 hours 30 min'),
    (ped1, 'ENTREGADO',     NOW() - INTERVAL '2 hours 25 min');

  -- ─── PEDIDO 2: Combo Pareja con pepperoni grande (entregado) ───
  INSERT INTO pedidos (folio, cliente_nombre, tipo_entrega, estado, tiempo_estimado_min, total, fecha_creacion)
  VALUES ('PED-SEED-002', 'María López', 'LOCAL', 'ENTREGADO', 25, 229.00, NOW() - INTERVAL '2 hours')
  RETURNING id INTO ped2;

  -- Línea del combo (padre)
  INSERT INTO detalle_pedido (pedido_id, paquete_id, cantidad, precio_unitario, subtotal)
  VALUES (ped2, paq_pareja, 1, 229.00, 229.00)
  RETURNING id INTO det_combo;

  -- Hijos del combo
  INSERT INTO detalle_pedido (pedido_id, presentacion_id, parent_detalle_id, cantidad, precio_unitario, subtotal) VALUES
    (ped2, pres_pep_gde, det_combo, 1, 0.00, 0.00),
    (ped2, pres_coca_2l, det_combo, 1, 0.00, 0.00);

  INSERT INTO seguimiento_estados (pedido_id, estado_registrado, fecha_hora) VALUES
    (ped2, 'PENDIENTE',     NOW() - INTERVAL '2 hours'),
    (ped2, 'PREPARANDO',    NOW() - INTERVAL '1 hour 50 min'),
    (ped2, 'HORNEANDO',     NOW() - INTERVAL '1 hour 40 min'),
    (ped2, 'LISTO_ENTREGA', NOW() - INTERVAL '1 hour 30 min'),
    (ped2, 'ENTREGADO',     NOW() - INTERVAL '1 hour 25 min');

  -- ─── PEDIDO 3: 2 pizzas para llevar (en preparación) ───
  INSERT INTO pedidos (folio, cliente_nombre, cliente_telefono, tipo_entrega, estado, tiempo_estimado_min, total, fecha_creacion)
  VALUES ('PED-SEED-003', 'Carlos García', '6149876543', 'PARA_LLEVAR', 'PREPARANDO', 30, 498.00, NOW() - INTERVAL '20 min')
  RETURNING id INTO ped3;

  INSERT INTO detalle_pedido (pedido_id, presentacion_id, cantidad, precio_unitario, subtotal) VALUES
    (ped3, pres_mex_fam, 1, 249.00, 249.00),
    (ped3, pres_car_fam, 1, 249.00, 249.00);

  INSERT INTO seguimiento_estados (pedido_id, estado_registrado, fecha_hora) VALUES
    (ped3, 'PENDIENTE',  NOW() - INTERVAL '20 min'),
    (ped3, 'PREPARANDO', NOW() - INTERVAL '15 min');

  -- ─── PEDIDO 4: Pedido a domicilio (pendiente) ───
  INSERT INTO pedidos (folio, cliente_nombre, cliente_telefono, tipo_entrega, estado, tiempo_estimado_min, total, fecha_creacion)
  VALUES ('PED-SEED-004', 'Ana Martínez', '6145551234', 'DOMICILIO', 'PENDIENTE', 45, 362.00, NOW() - INTERVAL '5 min')
  RETURNING id INTO ped4;

  INSERT INTO detalle_pedido (pedido_id, presentacion_id, cantidad, precio_unitario, subtotal) VALUES
    (ped4, pres_veg_fam, 1, 249.00, 249.00),
    (ped4, pres_dedos,   1,  55.00,  55.00),
    (ped4, pres_fanta,   1,  42.00,  42.00),
    (ped4, pres_agua,    1,  18.00,  16.00);

  INSERT INTO seguimiento_estados (pedido_id, estado_registrado, fecha_hora) VALUES
    (ped4, 'PENDIENTE', NOW() - INTERVAL '5 min');

  -- ─── PEDIDO 5: Cancelado (para probar ese flujo) ───
  INSERT INTO pedidos (folio, cliente_nombre, tipo_entrega, estado, tiempo_estimado_min, total, motivo_cancelacion, fecha_creacion)
  VALUES ('PED-SEED-005', 'Cliente Mostrador', 'LOCAL', 'CANCELADO', 15, 199.00, 'El cliente cambió de opinión', NOW() - INTERVAL '1 hour')
  RETURNING id INTO ped5;

  INSERT INTO detalle_pedido (pedido_id, presentacion_id, cantidad, precio_unitario, subtotal) VALUES
    (ped5, pres_bbq_gde, 1, 199.00, 199.00);

  INSERT INTO seguimiento_estados (pedido_id, estado_registrado, fecha_hora) VALUES
    (ped5, 'PENDIENTE',  NOW() - INTERVAL '1 hour'),
    (ped5, 'CANCELADO',  NOW() - INTERVAL '55 min');

END $$;

-- ============================================================
-- 10. USUARIOS (por si no corriste el seed de Node.js)
-- ============================================================
DO $$
BEGIN
  -- Solo inserta si la tabla existe y no hay usuarios
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
    -- Los passwords ya hasheados no se pueden generar aquí.
    -- Usa el script Node.js:  node seed_usuarios.js
    RAISE NOTICE '⚠️  Para usuarios con contraseña hasheada, ejecuta: node seed_usuarios.js';
  END IF;
END $$;

-- ============================================================
-- ✅ VERIFICACIÓN FINAL
-- ============================================================
DO $$
DECLARE
  n_categorias     INT;
  n_tamanos        INT;
  n_ingredientes   INT;
  n_productos      INT;
  n_presentaciones INT;
  n_recetas        INT;
  n_paquetes       INT;
  n_contenido      INT;
  n_pedidos        INT;
  n_detalles       INT;
  n_seguimiento    INT;
BEGIN
  SELECT COUNT(*) INTO n_categorias     FROM categorias;
  SELECT COUNT(*) INTO n_tamanos        FROM tamanos;
  SELECT COUNT(*) INTO n_ingredientes   FROM ingredientes;
  SELECT COUNT(*) INTO n_productos      FROM productos;
  SELECT COUNT(*) INTO n_presentaciones FROM presentaciones;
  SELECT COUNT(*) INTO n_recetas        FROM recetas;
  SELECT COUNT(*) INTO n_paquetes       FROM paquetes;
  SELECT COUNT(*) INTO n_contenido      FROM contenido_paquete;
  SELECT COUNT(*) INTO n_pedidos        FROM pedidos;
  SELECT COUNT(*) INTO n_detalles       FROM detalle_pedido;
  SELECT COUNT(*) INTO n_seguimiento    FROM seguimiento_estados;

  RAISE NOTICE '';
  RAISE NOTICE '🍕 ═══════════════════════════════════════════';
  RAISE NOTICE '   RESUMEN DEL SEED - PIZZAS LAURITA';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '  Categorías ........... %', n_categorias;
  RAISE NOTICE '  Tamaños .............. %', n_tamanos;
  RAISE NOTICE '  Ingredientes ......... %', n_ingredientes;
  RAISE NOTICE '  Productos ............ %', n_productos;
  RAISE NOTICE '  Presentaciones ....... %', n_presentaciones;
  RAISE NOTICE '  Recetas (BOM) ........ %', n_recetas;
  RAISE NOTICE '  Paquetes/Combos ...... %', n_paquetes;
  RAISE NOTICE '  Contenido Paquetes ... %', n_contenido;
  RAISE NOTICE '  Pedidos .............. %', n_pedidos;
  RAISE NOTICE '  Detalle Pedidos ...... %', n_detalles;
  RAISE NOTICE '  Seguimiento Estados .. %', n_seguimiento;
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '  ✅ Seed completado exitosamente!';
  RAISE NOTICE '═══════════════════════════════════════════════';
END $$;
