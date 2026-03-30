-- Database: pizzas_laurita

-- DROP DATABASE IF EXISTS pizzas_laurita;

CREATE DATABASE pizzas_laurita
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Spain.1252'
    LC_CTYPE = 'Spanish_Spain.1252'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

COMMENT ON DATABASE pizzas_laurita
    IS 'Sistema para la gestión de pizzas Laurita';

-- =========================================================================
-- MÓDULO 1: INVENTARIO Y MATERIA PRIMA
-- =========================================================================

CREATE TABLE ingredientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL, -- Ej: 'gramos', 'mililitros', 'piezas'
    stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- MÓDULO 2: CATÁLOGO DE PRODUCTOS Y RECETAS (BOM)
-- =========================================================================

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'Pizzas', 'Bebidas', 'Snacks'
    descripcion TEXT
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Las presentaciones definen los tamaños y precios base
CREATE TABLE presentaciones (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL, -- Ej: 'Grande', 'Mediana', 'Personal', '2 Litros'
    precio DECIMAL(10,2) NOT NULL
);

-- Tabla intermedia: Define qué y cuánto lleva cada presentación (La Receta)
CREATE TABLE recetas (
    id SERIAL PRIMARY KEY,
    presentacion_id INT NOT NULL REFERENCES presentaciones(id) ON DELETE CASCADE,
    ingrediente_id INT NOT NULL REFERENCES ingredientes(id) ON DELETE RESTRICT,
    cantidad_requerida DECIMAL(10,2) NOT NULL, -- Lo que se descontará del stock
    UNIQUE(presentacion_id, ingrediente_id)
);

-- =========================================================================
-- MÓDULO 3: PAQUETES Y COMBOS
-- =========================================================================

CREATE TABLE paquetes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_paquete DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Qué incluye el paquete por defecto
CREATE TABLE contenido_paquete (
    id SERIAL PRIMARY KEY,
    paquete_id INT NOT NULL REFERENCES paquetes(id) ON DELETE CASCADE,
    presentacion_id INT NOT NULL REFERENCES presentaciones(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL DEFAULT 1
);

-- =========================================================================
-- MÓDULO 4: OPERACIÓN Y PEDIDOS (KDS)
-- =========================================================================

-- Tipos enumerados para controlar los flujos de estado
CREATE TYPE estado_pedido AS ENUM (
    'PENDIENTE', 'PREPARANDO', 'HORNEANDO', 'LISTO_ENTREGA', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'
);

CREATE TYPE tipo_servicio AS ENUM (
    'LOCAL', 'DOMICILIO', 'PARA_LLEVAR'
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(20) UNIQUE NOT NULL,
    cliente_nombre VARCHAR(100),
    cliente_telefono VARCHAR(20),
    tipo_entrega tipo_servicio NOT NULL,
    estado estado_pedido DEFAULT 'PENDIENTE',
    tiempo_estimado_min INT NOT NULL, -- Calculado por el backend al ingresar
    alerta_retraso BOOLEAN DEFAULT FALSE,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- El corazón de la lógica de negocio (Soporta combos y mitades)
CREATE TABLE detalle_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    
    -- Referencias flexibles (Uno de los dos será NULL dependiendo si es paquete o producto individual)
    paquete_id INT REFERENCES paquetes(id) ON DELETE RESTRICT,
    presentacion_id INT REFERENCES presentaciones(id) ON DELETE RESTRICT,
    
    -- Recursividad para combos (Si este item pertenece a un paquete de este mismo pedido, apunta al ID del padre)
    parent_detalle_id INT REFERENCES detalle_pedido(id) ON DELETE CASCADE,
    
    -- Lógica de Mitades (Solo aplica si es Pizza)
    es_mitad_y_mitad BOOLEAN DEFAULT FALSE,
    sabor_a_id INT REFERENCES productos(id) ON DELETE RESTRICT,
    sabor_b_id INT REFERENCES productos(id) ON DELETE RESTRICT,
    
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notas_cocina TEXT,
    
    -- Validación a nivel base de datos para asegurar integridad
    CONSTRAINT check_item_type CHECK (
        (paquete_id IS NOT NULL AND presentacion_id IS NULL) OR 
        (paquete_id IS NULL AND presentacion_id IS NOT NULL)
    )
);

-- =========================================================================
-- MÓDULO 5: SEGUIMIENTO DE TIEMPOS (LOGÍSTICA)
-- =========================================================================

-- Registra la línea de tiempo exacta de cada pedido para auditorías y KPIs
CREATE TABLE seguimiento_estados (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    estado_registrado estado_pedido NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- ÍNDICES RECOMENDADOS (Para optimizar consultas en producción)
-- =========================================================================
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_ingredientes_stock ON ingredientes(stock_actual);
CREATE INDEX idx_detalle_pedido_parent ON detalle_pedido(parent_detalle_id);