-- 1. Llenamos el inventario
INSERT INTO ingredientes (nombre, unidad_medida, stock_actual, stock_minimo) VALUES
('Masa Grande', 'piezas', 100, 20),
('Salsa de Tomate', 'mililitros', 5000, 1000),
('Queso Mozzarella', 'gramos', 10000, 2000),
('Pepperoni', 'gramos', 3000, 500),
('Jamón', 'gramos', 3000, 500),
('Piña', 'gramos', 2000, 500);

-- 2. Creamos Categorías y Productos Base
INSERT INTO categorias (nombre) VALUES ('Pizzas'), ('Bebidas');

-- Nota: El ID 3 será una base "genérica" para cuando armamos mitades
INSERT INTO productos (categoria_id, nombre) VALUES
(1, 'Pizza Pepperoni'),
(1, 'Pizza Hawaiana'),
(1, 'Base Pizza Gde (Para Mitades)'),
(2, 'Refresco Cola');

-- 3. Creamos Presentaciones (Tamaños)
INSERT INTO presentaciones (producto_id, nombre, precio) VALUES
(1, 'Grande', 150.00), -- ID 1 (Pepperoni Gde)
(2, 'Grande', 160.00), -- ID 2 (Hawaiana Gde)
(3, 'Grande', 150.00), -- ID 3 (Base Gde)
(4, '2 Litros', 45.00); -- ID 4 (Refresco)

-- 4. Definimos las Recetas (BOM)
-- Receta Pepperoni Gde (Lleva masa, salsa, queso y pepperoni)
INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
(1, 1, 1), (1, 2, 150), (1, 3, 200), (1, 4, 100);

-- Receta Hawaiana Gde (Lleva masa, salsa, queso, jamón y piña)
INSERT INTO recetas (presentacion_id, ingrediente_id, cantidad_requerida) VALUES
(2, 1, 1), (2, 2, 150), (2, 3, 200), (2, 5, 80), (2, 6, 80);

-- 5. Armamos un Paquete
INSERT INTO paquetes (nombre, precio_paquete) VALUES ('Combo Pareja', 180.00);
-- El paquete incluye 1 Base Pizza Gde (ID 3) y 1 Refresco (ID 4)
INSERT INTO contenido_paquete (paquete_id, presentacion_id, cantidad) VALUES
(1, 3, 1),
(1, 4, 1);

-- 6. SIMULAMOS LA VENTA: Entra un Pedido
INSERT INTO pedidos (folio, cliente_nombre, tipo_entrega, tiempo_estimado_min, total)
VALUES ('PED-001', 'PauMag', 'LOCAL', 15, 180.00);

-- 6.1 Insertamos el Paquete en el detalle (El Padre)
INSERT INTO detalle_pedido (pedido_id, paquete_id, precio_unitario, subtotal)
VALUES (1, 1, 180.00, 180.00); -- Asumimos que toma el ID 1

-- 6.2 Insertamos los hijos del paquete (apuntando al parent_detalle_id = 1)
-- Aquí ocurre la magia: La pizza es mitad Pepperoni (sabor_a_id = 1) y mitad Hawaiana (sabor_b_id = 2)
INSERT INTO detalle_pedido (pedido_id, presentacion_id, parent_detalle_id, es_mitad_y_mitad, sabor_a_id, sabor_b_id, cantidad, precio_unitario, subtotal)
VALUES (1, 3, 1, TRUE, 1, 2, 1, 0.00, 0.00);

-- El refresco (hijo del combo)
INSERT INTO detalle_pedido (pedido_id, presentacion_id, parent_detalle_id, cantidad, precio_unitario, subtotal)
VALUES (1, 4, 1, FALSE, NULL, NULL, 1, 0.00, 0.00);
