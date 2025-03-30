import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Adicionar meta tag de CSP
const metaCSP = document.createElement('meta');
metaCSP.httpEquiv = 'Content-Security-Policy';
metaCSP.content = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    https://www.googletagmanager.com
    https://*.googleapis.com 
    https://*.mercadopago.com 
    https://mercadopago.com 
    https://www.mercadopago.com 
    https://sdk.mercadopago.com
    https://accounts.google.com;
  connect-src 'self'
    https://simulachat-backend.onrender.com
    https://*.googleapis.com
    https://*.mercadopago.com;
  img-src 'self' data: https://*.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
`;
document.head.appendChild(metaCSP);

// Adicionar script do Mercado Pago
const mpScript = document.createElement('script');
mpScript.src = 'https://sdk.mercadopago.com/js/v2';
mpScript.async = true;
document.body.appendChild(mpScript);

// Adicionar análise de erros
window.addEventListener('error', (event) => {
  console.error('Erro não tratado:', event.error);
  // Implementar sistema de log de erros aqui
});

// Adicionar tratamento para promessas não tratadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promessa não tratada:', event.reason);
  // Implementar sistema de log de erros aqui
});

// Seu Google Client ID deve vir das variáveis de ambiente
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
if (!googleClientId) {
  console.warn('Google Client ID não configurado. Login com Google não funcionará corretamente.');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();