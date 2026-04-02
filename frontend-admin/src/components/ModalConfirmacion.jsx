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
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'modalFadeIn 0.3s ease-out',
      }}>
        <style>
          {`
            @keyframes modalFadeIn {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}
        </style>
        <span style={{ fontSize: '50px', display: 'block', marginBottom: '15px' }}>🚪</span>
        <h2 style={{ margin: '0 0 10px 0', color: '#2d3436', fontSize: '24px' }}>{titulo}</h2>
        <p style={{ color: '#636e72', fontSize: '16px', marginBottom: '25px', lineHeight: '1.5' }}>{mensaje}</p>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              border: '1px solid #dfe6e9',
              background: 'white',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#636e72',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.target.style.background = '#f1f2f6'}
            onMouseOut={(e) => e.target.style.background = 'white'}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: '#d63031',
              color: 'white',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(214,48,49,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Sí, salir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
