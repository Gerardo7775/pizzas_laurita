import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = ({ mensaje, appName }) => {
  const navigate = useNavigate();
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2>¡Oops! Alguien se comió esta rebanada 🍕</h2>
        <p>{mensaje || `La ruta que buscas no ha sido horneada en el entorno de ${appName || 'SIGP'}. ¡Verifica que estás en el puerto correcto de tu navegador!`}</p>
        <button className="btn-return" onClick={() => navigate('/')}>
          🔙 Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default NotFound;
