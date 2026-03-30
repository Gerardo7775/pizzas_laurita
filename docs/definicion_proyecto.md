# 📄 Documento de Definición del Proyecto (Project Charter)

- **Nombre del Proyecto:** Sistema Integrado de Gestión para Pizzería (SIGP)
- **Fecha:** 30 de marzo de 2026
- **Líder de Proyecto / Arquitecto:** PauMag
- **Ubicación:** México

---

## 1. Resumen Ejecutivo
El proyecto consiste en el diseño y desarrollo de un ecosistema de software compuesto por tres aplicaciones interconectadas para modernizar, automatizar y optimizar las operaciones de una pizzería. El núcleo del sistema se centrará en la **gestión exacta de inventarios** (deducción automática por recetas complejas) y la **optimización de los tiempos de preparación** en cocina mediante un sistema de alertas en tiempo real.

---

## 2. Problemática a Resolver
Actualmente, la operación se enfrenta a dos cuellos de botella críticos:

- **Pérdida de control de inventario:** La revisión manual de la materia prima genera errores humanos, olvidos y falta de visibilidad real sobre la capacidad de producción.
- **Retrasos en la entrega:** La falta de medición y seguimiento de los tiempos de preparación provoca demoras en los pedidos, lo que se traduce en un descontento directo de los clientes.

---

## 3. Objetivos del Sistema

- **Automatización del Inventario:** Implementar un sistema de deducción de materia prima basado en recetas (*Bill of Materials*), capaz de calcular proporciones exactas para productos complejos (pizzas "mitad y mitad" y combos).
- **Prevención de Desabasto:** Configurar un sistema de alertas automáticas cuando un ingrediente alcance su punto de reorden (stock mínimo).
- **Optimización de Tiempos (SLA):** Establecer tiempos estimados dinámicos para la preparación de pedidos y un sistema de semaforización (KDS) para alertar sobre posibles retrasos.
- **Trazabilidad:** Registrar la línea de tiempo exacta de cada pedido (*En espera, Preparando, Horneando, Entregando, Entregado*).

---

## 4. Alcance del Proyecto
El sistema se desarrollará en etapas y consistirá en tres plataformas principales que consumirán una API centralizada:

### Fase 1: Core Administrativo y Operativo

- **App 1: Panel de Administración e Inventario (Web):** Gestión de catálogos (productos, categorías, recetas, paquetes), CRUD de inventario, dashboard de ventas y panel de alertas de stock bajo.
- **App 2: Sistema de Visualización de Cocina - KDS (Tablet/Web):** Pantalla interactiva en tiempo real para gestionar el flujo de estados de los pedidos, con cronómetros visuales y alertas de retraso.

### Fase 2: Logística de Entrega

- **App 3: Aplicación para Repartidores (Móvil):** Herramienta para gestionar la última milla, asignación de rutas y confirmación de entregas de los pedidos con estado "Listo para entrega".

---

## 5. Arquitectura y Stack Tecnológico Propuesto

> **Base de Datos:** PostgreSQL
> *Modelo relacional estricto para garantizar la integridad de las recetas y transacciones financieras.*

> **Backend:** API RESTful
> *Orientada a microservicios/módulos con soporte para WebSockets (necesario para la comunicación en tiempo real con la App de cocina).*

> **Frontend Admin/Cocina:** Framework reactivo *(React.js, Vue.js o Angular).*

> **Frontend Repartidores (Fase 2):** Desarrollo móvil multiplataforma *(Flutter o React Native).*

---

## 6. Estado Actual del Proyecto

- [x] **Fase de Análisis:** Completada.
- [x] **Diseño de Base de Datos:** Completado. Se ha definido el modelo DDL en PostgreSQL y el Diagrama Entidad-Relación (ERD) en PlantUML, resolviendo la lógica de deducción de inventario para combinaciones complejas.
- [ ] **Siguiente Hito:** Definición de la capa de servicios (API REST) y prototipado de interfaces (UX/UI).
