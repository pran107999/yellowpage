const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else if (fs.existsSync(envExamplePath)) {
  require('dotenv').config({ path: envExamplePath });
} else {
  require('dotenv').config();
}
const http = require('http');
const https = require('https');
const app = require('./app');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 3001;

let server;
if (process.env.SSL_KEY && process.env.SSL_CERT) {
  const keyPath = path.resolve(process.env.SSL_KEY);
  const certPath = path.resolve(process.env.SSL_CERT);
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    server = https.createServer(
      {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
      app
    );
    console.log('Using HTTPS (WSS enabled)');
  }
}
if (!server) {
  server = http.createServer(app);
}

initSocket(server);

server.listen(PORT, () => {
  const protocol = server instanceof https.Server ? 'https' : 'http';
  console.log(`DesiNetwork API running on ${protocol}://localhost:${PORT}`);
  if (!process.env.RESEND_API_KEY) {
    console.log('Email: RESEND_API_KEY not set — OTP will be logged to console only.');
  } else {
    console.log('Email: Resend configured — verification emails will be sent.');
  }
});
