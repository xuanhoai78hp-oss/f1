const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Phục vụ file tĩnh từ thư mục hiện tại (chứa index.html)
app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    console.log('Phi công kết nối:', socket.id);

    // Người chơi tham gia phòng
    socket.on('join_game', (data) => {
        const playerData = data && typeof data === 'object' ? data : {};
        players[socket.id] = {
            id: socket.id,
            name: typeof playerData.name === 'string' && playerData.name.trim()
                ? playerData.name.trim().slice(0, 24)
                : 'PhiCôngVôDanh',
            country: typeof playerData.country === 'string' ? playerData.country : 'VN',
            x: 0,
            y: 0,
            angle: -Math.PI / 2,
            lap: 1,
            bestTime: 999,
            primaryColor: typeof playerData.primaryColor === 'string'
                ? playerData.primaryColor
                : '#3498db',
            secondaryColor: typeof playerData.secondaryColor === 'string'
                ? playerData.secondaryColor
                : '#ffffff'
        };
        io.emit('update_players', players);
    });

    // Cập nhật tọa độ di chuyển liên tục
    socket.on('player_move', (data) => {
        const player = players[socket.id];
        if (!player || !data || typeof data !== 'object') return;

        if (Number.isFinite(data.x)) player.x = data.x;
        if (Number.isFinite(data.y)) player.y = data.y;
        if (Number.isFinite(data.angle)) player.angle = data.angle;
        if (Number.isFinite(data.lap)) player.lap = data.lap;
        if (Number.isFinite(data.bestTime)) player.bestTime = data.bestTime;
        if (typeof data.primaryColor === 'string') player.primaryColor = data.primaryColor;
        if (typeof data.secondaryColor === 'string') player.secondaryColor = data.secondaryColor;

        socket.broadcast.emit('update_players', players);
    });

    // Khi người chơi thoát game
    socket.on('disconnect', () => {
        console.log('Phi công rời trận:', socket.id);
        delete players[socket.id];
        io.emit('update_players', players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server chiến trường đang chạy tại cổng ${PORT}`);
});