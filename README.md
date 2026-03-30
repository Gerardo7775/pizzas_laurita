# 🍕 Pizzas Laurita 

Sistema integral (monorepo) para la gestión, punto de venta (Caja) y sistema KDS (Kitchen Display System) para la Pizzería Laurita. El sistema cuenta con arquitectura robusta que soporta cálculos al vuelo de divisiones (Pizzas Mitad y Mitad), control de inventario y notificación a la cocina en tiempo real vía WebSockets.

## 🗂️ Arquitectura del Proyecto

El código está dividido en tres módulos principales dentro de este repositorio:

1. **`backend/`**: La API REST y servidor de sockets construido en **Node.js + Express** conectado a una base de datos relacional en Postgres. Arquitectónicamente sigue un patrón de "Clean Architecture".
2. **`frontend-admin/`**: Proyecto en **React + Vite**. Interfaz de usuario utilizada por la caja/administración para tomar pedidos y ver las alertas del inventario.
3. **`frontend-kds/`**: Proyecto en **React + Vite**. Interfaz de usuario para las tablets de la cocina (Kitchen Display System) que recibe las alertas de nuevos pedidos de forma reactiva (en tiempo real).
4. **`docs/`**: Contiene la documentación técnica e infraestructura de la base de datos (Script SQL y Diagramas Entidad-Relación).

## 🚀 Requisitos de Instalación

- Node.js versión `18.x` o superior.
- Base de datos PostgreSQL corriendo en local o servidor.

---

## 🛠️ Guía de Configuración

### 1. Preparar la Base de Datos
Primero, crea la base de datos ejecutando el esquema ubicado en `docs/database/diseño_base.sql`. Posteriormente, carga los catálogos y recetas de prueba usando los INSERTs que se encuentran en `docs/database/script.md`.

### 2. Configurar Variables de Entorno (Backend)
Dentro de la carpeta `backend/`, crea un archivo `.env` (si aún no existe) para que el servidor pueda conectarse a PostgreSQL. **(Nota: Las credenciales nunca se suben al repositorio gracias al `.gitignore`)**. 

Asegúrate de cambiar las contraseñas en función del usuario local de tu ordenador:

```env
PORT=3000

# Credenciales de conexión a la Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=mi_password_secreto
DB_NAME=pizzas_laurita
```

### 3. Instalación de Dependencias

Al estar alojado en un monorepo, cada componente cuenta con su propio entorno de dependencias de Node. Navega a cada subcarpeta e instala los paquetes:

```bash
# Para el Backend
cd backend
npm install

# Para el Frontend del Admin/Caja
cd ../frontend-admin
npm install

# Para el Frontend del KDS (Cocina)
cd ../frontend-kds
npm install
```

---

## ▶️ Ejecutar el Entorno en Desarrollo

### Levantar el Backend
Para poner en marcha el cerebro matemático y los websockets:
```bash
cd backend
npm run dev
```

### Levantar el Panel del Admin/Caja (Frontend)
En una nueva terminal, levanta el proyecto Vite:
```bash
cd frontend-admin
npm run dev
```

### Levantar Pantalla de la Cocina (Frontend KDS)
En otra terminal, levanta la interfaz visual de la cocina:
```bash
cd frontend-kds
npm run dev
```

## 🧪 Notas Adicionales
Para probar la "Prueba de Fuego", con el backend encendido, puedes ejecutar una solicitud REST de tipo POST al endpoint `http://localhost:3000/api/pedidos` armando el esquema JSON que involucre paquetes o mitades combinadas de pizza y observando cómo la base hace la inserción recursiva y emite el WebSocket.
