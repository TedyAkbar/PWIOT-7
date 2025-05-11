// Inisialisasi Socket.IO
const socket = io();

// Inisialisasi Chart.js
const ctx = document.getElementById('tempChart').getContext('2d');
const tempChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Suhu (°C)',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Variabel untuk status relay
let relayState = false;

// Fungsi untuk menampilkan monitoring
function showMonitoring() {
    document.getElementById('monitoringSection').style.display = 'block';
    document.getElementById('dataSensorSection').style.display = 'none';
    document.getElementById('userManagementSection').style.display = 'none';
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link[onclick="showMonitoring()"]').classList.add('active');
}

// Fungsi untuk menampilkan data sensor
function showDataSensor() {
    document.getElementById('monitoringSection').style.display = 'none';
    document.getElementById('dataSensorSection').style.display = 'block';
    document.getElementById('userManagementSection').style.display = 'none';
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link[onclick="showDataSensor()"]').classList.add('active');
    
    loadSensorData();
}

// Fungsi untuk menampilkan data user
function showUsers() {
    document.getElementById('monitoringSection').style.display = 'none';
    document.getElementById('dataSensorSection').style.display = 'none';
    document.getElementById('usersSection').style.display = 'block';
    document.getElementById('userManagementSection').style.display = 'none';
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link[onclick="showUsers()"]').classList.add('active');
    
    loadUsers();
}

// Fungsi untuk menampilkan manajemen user
function showUserManagement() {
    document.getElementById('monitoringSection').style.display = 'none';
    document.getElementById('dataSensorSection').style.display = 'none';
    document.getElementById('userManagementSection').style.display = 'block';
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link[onclick="showUserManagement()"]').classList.add('active');
    
    loadUsers();
}

// Fungsi untuk menampilkan modal tambah user
function showAddUserModal() {
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
}

// Fungsi untuk menambah user baru
async function addUser() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, role })
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            loadUsers();
            alert('User berhasil ditambahkan');
        } else {
            const data = await response.json();
            alert(data.error || 'Gagal menambah user');
        }
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Terjadi kesalahan saat menambah user');
    }
}

// Fungsi untuk menghapus user
async function deleteUser(userId) {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) {
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadUsers();
            alert('User berhasil dihapus');
        } else {
            const data = await response.json();
            alert(data.error || 'Gagal menghapus user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Terjadi kesalahan saat menghapus user');
    }
}

// Fungsi untuk logout
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Fungsi untuk toggle relay
async function toggleRelay() {
    try {
        // Update tampilan terlebih dahulu untuk responsivitas
        relayState = !relayState;
        updateRelayButton();

        const response = await fetch('/api/relay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ state: relayState })
        });

        if (!response.ok) {
            // Jika gagal, kembalikan ke status sebelumnya
            relayState = !relayState;
            updateRelayButton();
            
            if (response.status === 403) {
                alert('Hanya engineer yang dapat mengontrol relay');
            } else {
                alert('Gagal mengubah status relay');
            }
        }
    } catch (error) {
        // Jika error, kembalikan ke status sebelumnya
        relayState = !relayState;
        updateRelayButton();
        console.error('Error toggling relay:', error);
        alert('Gagal mengubah status relay');
    }
}

// Fungsi untuk memperbarui tampilan tombol relay
function updateRelayButton() {
    const button = document.getElementById('relayButton');
    const status = document.getElementById('relayStatus');
    const connectionStatus = document.getElementById('connectionStatus');
    
    if (relayState) {
        // Status ON - Hijau
        button.classList.remove('off');
        button.classList.add('on');
        button.style.backgroundColor = '#198754';
        button.style.borderColor = '#198754';
        status.textContent = 'ON';
        connectionStatus.textContent = 'Terhubung';
        connectionStatus.className = 'text-success';
    } else {
        // Status OFF - Merah
        button.classList.remove('on');
        button.classList.add('off');
        button.style.backgroundColor = '#dc3545';
        button.style.borderColor = '#dc3545';
        status.textContent = 'OFF';
        connectionStatus.textContent = 'Terputus';
        connectionStatus.className = 'text-danger';
    }
}

// Cek status login
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }

        // Tampilkan info user
        document.getElementById('userInfo').textContent = `Welcome, ${data.username} (${data.role})`;
        
        // Tampilkan menu manajemen user untuk supervisor dan engineer
        if (data.role === 'supervisor' || data.role === 'engineer') {
            document.getElementById('userManagementLink').style.display = 'block';
        } else {
            document.getElementById('userManagementLink').style.display = 'none';
        }

        // Enable tombol relay hanya untuk engineer
        const relayButton = document.getElementById('relayButton');
        if (data.role === 'engineer') {
            relayButton.disabled = false;
            relayButton.title = 'Klik untuk mengubah status relay';
        } else {
            relayButton.disabled = true;
            relayButton.title = 'Hanya engineer yang dapat mengontrol relay';
        }

        // Load data awal
        loadSensorData();
        loadUsers();
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = '/login.html';
    }
}

// Load data sensor
async function loadSensorData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error('Gagal mengambil data');
        }
        const data = await response.json();
        
        if (data.length > 0) {
            updateCurrentData(data[0]);
        }
        
        // Bersihkan tabel sebelum menambahkan data baru
        document.getElementById('data-list').innerHTML = '';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${new Date(item.waktu).toLocaleString('id-ID')}</td>
                <td>${item.suhu.toFixed(1)}</td>
                <td>
                    <span class="badge ${item.relay ? 'bg-success' : 'bg-danger'}">
                        ${item.relay ? 'ON' : 'OFF'}
                    </span>
                </td>
            `;
            document.getElementById('data-list').appendChild(row);
        });
        
        // Reset grafik
        tempChart.data.labels = [];
        tempChart.data.datasets[0].data = [];
        
        data.reverse().forEach(item => {
            updateChart(item);
        });
    } catch (error) {
        console.error('Error loading sensor data:', error);
        alert('Gagal memuat data sensor');
    }
}

// Load data users
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            if (response.status === 403) {
                // Jika bukan supervisor atau engineer, tampilkan pesan
                const tbody = document.getElementById('user-list');
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            Anda tidak memiliki akses untuk melihat data user
                        </td>
                    </tr>
                `;
                return;
            }
            throw new Error('Gagal mengambil data');
        }
        
        const users = await response.json();
        const tbody = document.getElementById('user-list');
        tbody.innerHTML = '';
        
        // Cek role user saat ini
        const currentUser = await fetch('/api/check-auth').then(res => res.json());
        const isSupervisor = currentUser.role === 'supervisor';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>${user.created_by_username || '-'}</td>
                <td>${new Date(user.created_at).toLocaleString('id-ID')}</td>
                <td>
                    ${isSupervisor ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})" ${user.username === 'admin' ? 'disabled' : ''}>
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.getElementById('user-list');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Gagal memuat data user
                </td>
            </tr>
        `;
    }
}

// Fungsi untuk memperbarui data terbaru
function updateCurrentData(data) {
    document.getElementById('current-temp').textContent = data.suhu.toFixed(1);
    document.getElementById('current-time').textContent = new Date(data.waktu).toLocaleString('id-ID');
}

// Fungsi untuk memperbarui grafik
function updateChart(data) {
    const time = new Date(data.waktu).toLocaleTimeString('id-ID');
    
    tempChart.data.labels.push(time);
    tempChart.data.datasets[0].data.push(data.suhu);
    
    // Batasi jumlah data di grafik
    if (tempChart.data.labels.length > 20) {
        tempChart.data.labels.shift();
        tempChart.data.datasets[0].data.shift();
    }
    
    tempChart.update();
}

// Event listener untuk data baru dari Socket.IO
socket.on('newData', (data) => {
    updateCurrentData(data);
    updateChart(data);
});

// Event listener untuk status relay dari Socket.IO
socket.on('relayState', (data) => {
    relayState = data.state;
    updateRelayButton();
});

// Load data setiap 5 detik
setInterval(loadSensorData, 5000);

// Cek auth saat halaman dimuat
checkAuth(); 