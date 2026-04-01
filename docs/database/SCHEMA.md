# Documento de Diseño de Base de Datos: Sistema Integrado de Pizzería

- **Motor de Base de Datos**: PostgreSQL
- **Fecha de Creación**: 30 de marzo de 2026
- **Autor / Arquitectura**: PauMag & Consultoría Técnica

---

## Consideraciones Arquitectónicas

- **Integridad Referencial**: Se utilizan llaves foráneas (`FOREIGN KEY`) en cascada o con restricción para evitar registros huérfanos.
- **Tipos de Datos**: Se emplea `DECIMAL(10,2)` para inventarios y finanzas, asegurando precisión en gramos/mililitros y moneda.
- **Lógica de Mitades y Combos**: La tabla `detalle_pedido` implementa un modelo de jerarquía (`parent_detalle_id`) para soportar la recursividad de los paquetes y las pizzas divididas.

---

## Script DDL (Data Definition Language)

### 1. Inventario y Catálogo

```sql
CREATE TABLE ingredientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL, -- Ej: 'gramos', 'mililitros', 'piezas'
    stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'Pizzas', 'Bebidas', 'Snacks'
    descripcion TEXT
);

CREATE TABLE tamanos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE -- Ej: 'Familiar', 'Mediana', 'Personal', '600ml'
);


CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);
```

### 2. Presentaciones y Recetas

> Las presentaciones definen los tamaños y precios base vinculando el producto a un catálogo de tamaños global.

```sql
CREATE TABLE presentaciones (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tamano_id INT NOT NULL REFERENCES tamanos(id) ON DELETE RESTRICT,
    precio DECIMAL(10,2) NOT NULL,
    UNIQUE(producto_id, tamano_id)
);

CREATE TABLE recetas (
    id SERIAL PRIMARY KEY,
    presentacion_id INT NOT NULL REFERENCES presentaciones(id) ON DELETE CASCADE,
    ingrediente_id INT NOT NULL REFERENCES ingredientes(id) ON DELETE RESTRICT,
    cantidad_requerida DECIMAL(10,2) NOT NULL, -- Lo que se descontará del stock
    UNIQUE(presentacion_id, ingrediente_id)
);
```

### 3. Paquetes y Promociones

> Define los paquetes disponibles y qué incluye cada uno por defecto.

```sql
CREATE TABLE paquetes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_paquete DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE contenido_paquete (
    id SERIAL PRIMARY KEY,
    paquete_id INT NOT NULL REFERENCES paquetes(id) ON DELETE CASCADE,
    presentacion_id INT NOT NULL REFERENCES presentaciones(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL DEFAULT 1
);
```

### 4. Pedidos y Detalles

> Tipos enumerados para controlar los flujos de estado y tipo de servicio.

```sql
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
```

#### Detalle de Pedido

> **El corazón de la lógica de negocio**: Soporta combos y mitades.

```sql
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
```

### 5. Auditoría y Rendimiento

> Registra la línea de tiempo exacta de cada pedido para auditorías y KPIs, además de definir índices para optimizar las consultas recurrentes.

```sql
CREATE TABLE seguimiento_estados (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    estado_registrado estado_pedido NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_ingredientes_stock ON ingredientes(stock_actual);
CREATE INDEX idx_detalle_pedido_parent ON detalle_pedido(parent_detalle_id);
```

---

## 📝 Nota Técnica para el Equipo de Desarrollo Backend

> **La columna `parent_detalle_id` en `detalle_pedido` es la clave para resolver el escenario de jerarquía de paquetes.** 
> 
> Cuando el backend inserte un *"Paquete Dúo"*, insertará una fila principal con el `paquete_id`. Acto seguido, insertará las filas correspondientes a la pizza y a la bebida con su respectivo `presentacion_id`, pero asignando el ID de la fila principal en `parent_detalle_id`. 
> 
> Si esa pizza es *"mitad y mitad"*, simplemente se pondrá la bandera `es_mitad_y_mitad = TRUE` y se llenarán `sabor_a_id` y `sabor_b_id`. El algoritmo de reducción de inventario leerá esto sin problemas.
