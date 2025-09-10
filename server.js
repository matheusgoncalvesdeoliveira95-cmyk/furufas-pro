// Importa as bibliotecas necessárias para criar o servidor web e o Socket.IO
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Base de dados temporária na memória do servidor.
// **ATENÇÃO:** Os dados aqui serão perdidos se o servidor for reiniciado!
let markedDays = {};

// Configura o Express para servir o arquivo 'index.html' quando alguém acessar a URL principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Configura o Socket.IO para lidar com as conexões e eventos
io.on('connection', (socket) => {
  console.log('Um usuário se conectou.');

  // Envia todos os dados do calendário para o novo usuário assim que ele se conecta
  socket.emit('initial_data', markedDays);

  // Escuta o evento 'mark_day' (quando alguém clica em um dia)
  socket.on('mark_day', (data) => {
    const { monthKey, day } = data;
    if (!markedDays[monthKey]) {
      markedDays[monthKey] = {};
    }
    if (!markedDays[monthKey][day]) {
      markedDays[monthKey][day] = { count: 0 };
    }
    markedDays[monthKey][day].count++;
    
    // Envia a atualização completa da base de dados para TODOS os usuários conectados
    io.emit('update_data', markedDays);
  });
  
  // Escuta o evento 'reset_day' (quando alguém clica no 'x' para resetar um dia)
  socket.on('reset_day', (data) => {
    const { monthKey, day } = data;
    if (markedDays[monthKey] && markedDays[monthKey][day]) {
      markedDays[monthKey][day].count = 0;
      // Envia a atualização completa da base de dados para TODOS os usuários
      io.emit('update_data', markedDays);
    }
  });

  // Evento de desconexão de um usuário
  socket.on('disconnect', () => {
    console.log('Um usuário se desconectou.');
  });
});

// Define a porta do servidor. O Render usa a porta 'process.env.PORT'
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});