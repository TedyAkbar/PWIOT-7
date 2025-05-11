# Sistem Monitoring IoT dengan Node.js dan MySQL

Sistem monitoring IoT sederhana yang menampilkan data sensor suhu secara real-time menggunakan Node.js, Express, MySQL, dan Socket.IO.

## Persyaratan

- Node.js (v14 atau lebih baru)
- MySQL Server
- phpMyAdmin (opsional, untuk manajemen database)

## Instalasi

1. Clone repositori ini
2. Install dependensi:
   ```bash
   npm install
   ```
3. Buat database dan tabel menggunakan file `database.sql`:
   - Buka phpMyAdmin
   - Import file `database.sql`
   - Atau jalankan perintah SQL secara manual

4. Sesuaikan konfigurasi database di `db/connection.js`:
   ```javascript
   {
     host: 'localhost',
     user: 'root',
     password: '', // Sesuaikan dengan password MySQL Anda
     database: 'iot_db'
   }
   ```

## Menjalankan Aplikasi

1. Jalankan server:
   ```bash
   npm start
   ```
2. Buka browser dan akses `http://localhost:3000`

## Penggunaan dengan ESP32

Untuk mengirim data dari ESP32, gunakan endpoint berikut:
- URL: `http://[IP_SERVER]:3000/api/sensor`
- Method: POST
- Body (JSON):
  ```json
  {
    "suhu": 25.5,
    "waktu": "2024-01-01T12:00:00Z"
  }
  ```

## Fitur

- Tampilan real-time data sensor
- Grafik suhu interaktif
- Riwayat data dalam bentuk tabel
- API untuk menerima data dari sensor
- WebSocket untuk update real-time

## Struktur Folder

```
project/
├── server.js
├── database.sql
├── package.json
├── esp32_code.ino
└── public/
    ├── dashboard.html
    ├── dashboard.js
    └── login.html
``` 
## Comment untuk Node.js

### Perintah Dasar
```bash
npm start          # Menjalankan aplikasi Node.js
npm run dev        # Menjalankan dengan nodemon (auto restart)
npm install        # Menginstall semua package dari package.json
npm install [package] --save     # Install package dan simpan ke dependencies
npm install [package] --save-dev # Install package dan simpan ke devDependencies
```

### Perintah Server
```bash
Ctrl + C          # Menghentikan server Node.js
Ctrl + S          # Menyimpan file (untuk auto restart dengan nodemon)
```

### Perintah Package Manager
```bash
npm init          # Membuat package.json baru
npm update        # Update semua package ke versi terbaru
npm uninstall [package] # Menghapus package
npm list          # Menampilkan daftar package yang terinstall
```

### Perintah Development
```bash
npm install nodemon --save-dev    # Install nodemon untuk development
npm install express              # Install Express.js framework
npm install mysql2               # Install MySQL driver
npm install socket.io            # Install Socket.IO untuk real-time
```

### Perintah Database
```bash
npm install mysql2               # Install MySQL driver
npm install sequelize           # Install ORM Sequelize (opsional)
```

### Perintah Keamanan
```bash
npm audit        # Cek keamanan package
npm audit fix    # Perbaiki masalah keamanan
```

### Perintah Git
```bash
git init         # Inisialisasi repository Git
git add .        # Tambahkan semua file ke staging
git commit -m "pesan" # Commit perubahan
git push         # Push ke repository
```

### Perintah Debug
```bash
node --inspect   # Menjalankan Node.js dengan mode debug
npm run debug    # Menjalankan aplikasi dengan mode debug
```

### Perintah Build
```bash
npm run build    # Build aplikasi (jika menggunakan TypeScript/React)
npm run test     # Menjalankan test
```

### Perintah Environment
```bash
# Buat file .env untuk environment variables
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=iot_db
```

### Perintah Maintenance
```bash
npm cache clean  # Membersihkan cache npm
npm outdated     # Cek package yang perlu diupdate
npm prune        # Hapus package yang tidak digunakan
```
