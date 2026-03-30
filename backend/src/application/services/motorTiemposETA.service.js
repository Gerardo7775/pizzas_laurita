/**
 * Servicio Matemático: Motor ETA Dinámico
 * Capa de Aplicación
 * 
 * Mide el encolamiento actual y suma minutos extras a la preparación normal.
 */

class MotorTiemposETAService {
  calcular(tiempoBase, pizzasEnColaActual) {
    // Ejemplo de logica (configurable): 2 min extra por cada 3 pizzas en cola
    const retraso = Math.floor(pizzasEnColaActual / 3) * 2;
    return tiempoBase + retraso;
  }
}

module.exports = new MotorTiemposETAService();
