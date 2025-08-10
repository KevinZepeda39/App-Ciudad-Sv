const config = {
  API_URL: __DEV__
    ? 'http://localhost:5000' // Prueba esta opción primero
    // Si no funciona, intenta con:
    // 'http://10.0.2.2:5000' // Para emulador Android
   | 'http://http://10.0.2.2:5000' 
    : 'https://api.miciudadsv.com', // Production URL
};

export default config;
