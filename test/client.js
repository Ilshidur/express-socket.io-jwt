const client = require('socket.io-client');

const socket1 = client('http://localhost:3001?name=electron-app&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ5byI6ImhlbGxvIn0.lrtlXyP8ix_3O-J89BNM1dEMqZzegLFGmrBIt3i74qo');
const socket2 = client('http://localhost:3001?name=website&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ5byI6ImhlbGxvMiJ9.8FPn7BHMzzofwNHFJ-7KDScRzl8eVnvF1do_026P1wA');

socket1.on('message', (message) => console.log('electron-app got', message));
socket2.on('message', (message) => console.log('website got', message));
