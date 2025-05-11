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

// Fungsi untuk memformat waktu
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID');
}

// Fungsi untuk memperbarui tampilan data terbaru
function updateCurrentData(data) {
    document.getElementById('current-temp').textContent = data.suhu;
    document.getElementById('current-time').textContent = formatTime(data.waktu);
}

// Fungsi untuk memperbarui grafik
function updateChart(data) {
    tempChart.data.labels.push(formatTime(data.waktu));
    tempChart.data.datasets[0].data.push(data.suhu);
    
    // Batasi jumlah data yang ditampilkan di grafik
    if (tempChart.data.labels.length > 20) {
        tempChart.data.labels.shift();
        tempChart.data.datasets[0].data.shift();
    }
    
    tempChart.update();
}

// Fungsi untuk memperbarui tabel
function updateTable(data) {
    const tbody = document.getElementById('data-list');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${formatTime(data.waktu)}</td>
        <td>${data.suhu}°C</td>
    `;
    
    tbody.insertBefore(row, tbody.firstChild);
    
    // Batasi jumlah baris di tabel
    if (tbody.children.length > 20) {
        tbody.removeChild(tbody.lastChild);
    }
}

// Event listener untuk data baru dari Socket.IO
socket.on('newData', (data) => {
    updateCurrentData(data);
    updateChart(data);
    updateTable(data);
});

// Ambil data awal saat halaman dimuat
fetch('/api/data')
    .then(res => res.json())
    .then(data => {
        // Tampilkan data terbaru
        if (data.length > 0) {
            updateCurrentData(data[0]);
        }
        
        // Isi tabel dengan data historis
        data.forEach(item => {
            updateTable(item);
        });
        
        // Isi grafik dengan data historis
        data.reverse().forEach(item => {
            updateChart(item);
        });
    })
    .catch(err => console.error('Error fetching initial data:', err)); 