// Basic Chart implementation
let habitChart = null;

async function initChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    habitChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Last 7 Days'],
            datasets: [{
                label: 'Habits Completed',
                data: [0], // Placeholder
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    await updateChart();
}

// Function to aggregate data and update chart
async function updateChart() {
    if (!habitChart) return;

    const token = localStorage.getItem('token');
    // Fetch all habits
    const habitsRes = await fetch('http://localhost:5000/api/habits', { headers: { 'x-auth-token': token } });
    const habits = await habitsRes.json();

    // For this simple chart, let's show "Total Completions per Day for last 7 days"
    const last7Days = [];
    const labels = [];
    const params = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        last7Days.push(d.getTime());
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        params.push(0);
    }

    // For each habit, get logs
    // This is N+1 problem on client side, but okay for MVP with few habits
    for (const habit of habits) {
        const logsRes = await fetch(`http://localhost:5000/api/habits/${habit._id}/logs`, { headers: { 'x-auth-token': token } });
        const logs = await logsRes.json();

        logs.forEach(log => {
            const logDate = new Date(log.date).setHours(0, 0, 0, 0);
            const index = last7Days.indexOf(logDate);
            if (index !== -1 && log.completed) {
                params[index]++;
            }
        });
    }

    habitChart.data.labels = labels;
    habitChart.data.datasets[0].data = params;
    habitChart.update();
}

window.updateChart = updateChart;
document.addEventListener('DOMContentLoaded', initChart);
