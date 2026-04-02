import React from 'react';

const ModalConfirmacion = ({ active, onConfirm, onCancel, titulo, mensaje }) => {
  if (!active) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        background: 'rgba(20, 20, 40, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '35px',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '430px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        color: 'white',
        fontFamily: 'sans-serif',
        animation: 'kdsModalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <style>
          {`
            @keyframes kdsModalIn {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}
        </style>
        
        <span style={{ 
          fontSize: '60px', 
          display: 'block', 
          marginBottom: '20px',
          filter: 'drop-shadow(0 0 15px rgba(255, 71, 87, 0.4))' 
        }}>🔥</span>
        
        <h2 style={{ 
          margin: '0 0 12px 0', 
          color: '#ff4757', 
          fontSize: '28px',
          fontWeight: '800',
          letterSpacing: '0.5px'
        }}>{titulo}</h2>
        
        <p style={{ 
          color: '#a4b0be', 
          fontSize: '18px', 
          marginBottom: '30px', 
          lineHeight: '1.6' 
        }}>{mensaje}</p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#f1f2f6',
              fontWeight: '700',
              fontSize: '15px',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #ff4757 0%, #ee5253 100%)',
              color: 'white',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '15px',
              boxShadow: '0 8px 20px rgba(255, 71, 87, 0.3)',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            SÍ, SALIR
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
