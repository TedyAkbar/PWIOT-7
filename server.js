const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Konfigurasi database
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'iot_db'
});

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
    secret: 'rahasia-iot-monitoring',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // set ke true jika menggunakan HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 jam
    }
}));

// Middleware untuk cek autentikasi
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Route untuk dashboard - cek auth
app.get('/dashboard.html', (req, res, next) => {
    if (!req.session || !req.session.user) {
        res.redirect('/login.html');
    } else {
        next();
    }
});

// API Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await conn.promise().query(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Username atau password salah' });
        }

        const user = users[0];
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        res.json({ message: 'Login berhasil' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat login' });
    }
});

// API Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout berhasil' });
});

// API Cek Auth
app.get('/api/check-auth', (req, res) => {
    if (req.session && req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// API untuk mengambil data sensor
app.get('/api/data', requireAuth, (req, res) => {
    conn.query(
        'SELECT id, suhu, relay, waktu FROM data_sensor ORDER BY id ASC LIMIT 20',
        (err, rows) => {
            if (err) {
                console.error('Error fetching data:', err);
                return res.status(500).json({ error: 'Gagal mengambil data' });
            }
            res.json(rows);
        }
    );
});

// API untuk mengambil daftar user
app.get('/api/users', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'supervisor') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }

    try {
        const [users] = await conn.promise().query(`
            SELECT u.*, c.username as created_by_username 
            FROM users u 
            LEFT JOIN users c ON u.created_by = c.id 
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Gagal mengambil data user' });
    }
});

// API untuk menambah user baru
app.post('/api/users', requireAuth, async (req, res) => {
    // Cek apakah user adalah supervisor
    if (req.session.user.role !== 'supervisor') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }

    const { username, password, role } = req.body;

    try {
        // Cek apakah username sudah ada
        const [existingUsers] = await conn.promise().query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Tambah user baru
        await conn.promise().query(
            'INSERT INTO users (username, password, role, created_by) VALUES (?, ?, ?, ?)',
            [username, password, role, req.session.user.id]
        );

        res.json({ message: 'User berhasil ditambahkan' });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Gagal menambah user' });
    }
});

// API untuk menghapus user
app.delete('/api/users/:id', requireAuth, async (req, res) => {
    // Cek apakah user adalah supervisor
    if (req.session.user.role !== 'supervisor') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }

    const userId = req.params.id;

    try {
        // Cek apakah user yang akan dihapus adalah admin
        const [users] = await conn.promise().query(
            'SELECT username FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        if (users[0].username === 'admin') {
            return res.status(400).json({ error: 'Tidak dapat menghapus user admin' });
        }

        // Hapus user
        await conn.promise().query(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );

        res.json({ message: 'User berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Gagal menghapus user' });
    }
});

// API untuk kontrol relay
app.post('/api/relay', requireAuth, async (req, res) => {
    // Cek apakah user adalah engineer
    if (req.session.user.role !== 'engineer') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }

    const { state } = req.body;

    try {
        // Ambil suhu terakhir
        const [lastData] = await conn.promise().query(
            'SELECT suhu FROM data_sensor ORDER BY waktu DESC LIMIT 1'
        );
        
        const lastTemperature = lastData.length > 0 ? lastData[0].suhu : 0;

        // Simpan status relay ke data_sensor dengan suhu terakhir
        await conn.promise().query(
            'INSERT INTO data_sensor (suhu, relay) VALUES (?, ?)',
            [lastTemperature, state]
        );
        
        // Broadcast status relay ke semua client
        io.emit('relayState', { state });
        
        res.json({ message: 'Status relay berhasil diubah' });
    } catch (error) {
        console.error('Error controlling relay:', error);
        res.status(500).json({ error: 'Gagal mengubah status relay' });
    }
});

// API untuk mengambil riwayat relay
app.get('/api/relay-history', requireAuth, async (req, res) => {
    try {
        const [history] = await conn.promise().query(`
            SELECT rh.*, u.username as changed_by_username 
            FROM relay_history rh
            JOIN users u ON rh.changed_by = u.id
            ORDER BY rh.waktu DESC
            LIMIT 50
        `);
        res.json(history);
    } catch (error) {
        console.error('Error fetching relay history:', error);
        res.status(500).json({ error: 'Gagal mengambil riwayat relay' });
    }
});

// API untuk mengambil semua data sensor
app.get('/api/database', requireAuth, (req, res) => {
    conn.query(
        'SELECT id, suhu, relay, waktu FROM data_sensor ORDER BY id ASC',
        (err, rows) => {
            if (err) {
                console.error('Error fetching database:', err);
                return res.status(500).json({ error: 'Gagal mengambil data' });
            }
            res.json(rows);
        }
    );
});

// Endpoint untuk mengecek status relay
app.get('/api/relay-status', (req, res) => {
  const query = 'SELECT relay FROM data_sensor ORDER BY waktu DESC LIMIT 1';
  conn.query(query, (error, results) => {
    if (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    
    if (results.length > 0) {
      res.json({ state: results[0].relay });
    } else {
      res.json({ state: false });
    }
  });
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start server
const port = 3000;
server.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
}); 