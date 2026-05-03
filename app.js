document.addEventListener('DOMContentLoaded', () => {

    // --- Navigation Logic ---
    const navButtons = document.querySelectorAll('.nav-btn, .btn-nav-trigger');
    const views = document.querySelectorAll('.view');

    function switchView(targetId) {
        // Hide all views
        views.forEach(view => {
            view.classList.remove('active');
            // Reset opacity and transform simply for css transition
            setTimeout(() => {
                if (!view.classList.contains('active')) {
                    view.style.display = 'none';
                }
            }, 400);
        });

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.target === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Show target view
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.style.display = 'block';
            // Slight delay to allow display:block to apply before animating opacity
            setTimeout(() => {
                targetView.classList.add('active');
            }, 10);
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = btn.dataset.target;
            if (target) switchView(target);
        });
    });

    // --- COCOMO I Logic ---
    /*
        COCOMO I Constants:
        Project     | a     | b     | c     | d
        ------------------------------------------
        Organic     | 2.4   | 1.05  | 2.5   | 0.38
        Semi-dtchd  | 3.0   | 1.12  | 2.5   | 0.35
        Embedded    | 3.6   | 1.20  | 2.5   | 0.32
    */
    const cocomo1Models = {
        organic: { a: 2.4, b: 1.05, c: 2.5, d: 0.38 },
        semidetached: { a: 3.0, b: 1.12, c: 2.5, d: 0.35 },
        embedded: { a: 3.6, b: 1.20, c: 2.5, d: 0.32 }
    };

    let c1ChartInstance = null;
    let cachedC1Effort = 0;

    // Smart Hint for COCOMO 1 LOC
    const locInput1 = document.getElementById('c1-loc');
    const locHint1 = document.getElementById('c1-loc-hint');
    const typeSelect1 = document.getElementById('c1-type');

    locInput1.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val) || val <= 0) {
            locHint1.textContent = "Please enter a valid KLOC > 0";
            locHint1.classList.remove('active-hint');
            typeSelect1.value = "";
            return;
        }

        const kloc = val;
        locHint1.classList.add('active-hint');

        if (kloc <= 50) {
            locHint1.textContent = `Size: ${kloc.toFixed(1)} KLOC. Suggestion: Organic mode.`;
            typeSelect1.value = 'organic';
        } else if (kloc <= 300) {
            locHint1.textContent = `Size: ${kloc.toFixed(1)} KLOC. Suggestion: Semi-detached mode.`;
            typeSelect1.value = 'semidetached';
        } else {
            locHint1.textContent = `Size: ${kloc.toFixed(1)} KLOC. Suggestion: Embedded mode.`;
            typeSelect1.value = 'embedded';
        }
    });

    document.getElementById('form-cocomo1').addEventListener('submit', (e) => {
        e.preventDefault();

        const kloc = parseFloat(locInput1.value);
        const type = typeSelect1.value;

        if (!kloc || !type) return;
        const model = cocomo1Models[type];

        const effort = model.a * Math.pow(kloc, model.b);
        const time = model.c * Math.pow(effort, model.d);

        cachedC1Effort = effort; // Store for comparison

        // Update UI
        document.getElementById('c1-res-effort').textContent = Math.round(effort).toLocaleString();
        document.getElementById('c1-res-time').textContent = Math.round(time).toString();
        document.getElementById('c1-results').classList.remove('hidden');

        // Render Chart
        renderChart('c1-chart', 'Effort (PM)', effort, 'Time (Months)', time, c1ChartInstance, (inst) => c1ChartInstance = inst);

        // Show compare prompt
        setTimeout(() => {
            document.getElementById('c1-compare-prompt').classList.remove('hidden');
        }, 1000);
    });

    // --- COCOMO II (Early Design) Logic ---
    let c2ChartInstance = null;
    let cachedC2Effort = 0;

    document.getElementById('form-cocomo2').addEventListener('submit', (e) => {
        e.preventDefault();

        const kloc = parseFloat(document.getElementById('c2-loc').value);
        if (!kloc) return;

        const A = parseFloat(document.getElementById('c2-a').value);
        const B = parseFloat(document.getElementById('c2-b').value);
        const M = parseFloat(document.getElementById('c2-m').value);

        const effort = A * Math.pow(kloc, B) * M;
        const time = 3.67 * Math.pow(effort, 0.28 + 0.2 * (B - 0.91));

        cachedC2Effort = effort;

        // Update UI
        document.getElementById('c2-res-effort').textContent = Math.round(effort).toLocaleString();
        document.getElementById('c2-res-time').textContent = Math.round(time).toString();
        document.getElementById('c2-results').classList.remove('hidden');

        // Render Chart
        renderChart('c2-chart', 'Effort (PM)', effort, 'Time (Months)', time, c2ChartInstance, (inst) => c2ChartInstance = inst);

        // Show compare prompt
        setTimeout(() => {
            document.getElementById('c2-compare-prompt').classList.remove('hidden');
        }, 1000);
    });

    // --- Charting Utility ---
    // Common chart options for a sleek modern look
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    function renderChart(canvasId, label1, val1, label2, val2, chartInstance, setInstanceCallback) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        if (chartInstance) {
            chartInstance.destroy();
        }

        const newChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [label1, label2],
                datasets: [{
                    label: 'Estimation Metrics',
                    data: [val1, val2],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)', // Primary blue
                        'rgba(139, 92, 246, 0.8)'  // Secondary purple
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(139, 92, 246, 1)'
                    ],
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        border: { display: false }
                    }
                }
            }
        });

        setInstanceCallback(newChart);
    }

    // --- Comparison Feature ---
    let compChartInstance = null;

    document.getElementById('btn-compare-from-c1').addEventListener('click', () => {
        // User calculated C1, wants to see C2. We auto-fill and calculate C2.
        const originLoc = document.getElementById('c1-loc').value;
        if (originLoc) {
            document.getElementById('c2-loc').value = originLoc;
            document.getElementById('form-cocomo2').dispatchEvent(new Event('submit'));
        }
        showComparisonView();
    });

    document.getElementById('btn-compare-from-c2').addEventListener('click', () => {
        // User calculated C2, wants to see C1. We auto-fill and calculate C1.
        const originLoc = document.getElementById('c2-loc').value;
        if (originLoc) {
            const locInput = document.getElementById('c1-loc');
            locInput.value = originLoc;
            // dispatch input event to trigger smart hint and auto-select type
            locInput.dispatchEvent(new Event('input'));
            document.getElementById('form-cocomo1').dispatchEvent(new Event('submit'));
        }
        showComparisonView();
    });

    function showComparisonView() {
        switchView('view-compare');

        document.getElementById('comp-c1-effort').textContent = Math.round(cachedC1Effort).toLocaleString();
        document.getElementById('comp-c2-effort').textContent = Math.round(cachedC2Effort).toLocaleString();

        // Render Comparison Chart
        const ctx = document.getElementById('compare-chart').getContext('2d');
        if (compChartInstance) compChartInstance.destroy();

        compChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['COCOMO I', 'COCOMO II'],
                datasets: [{
                    label: 'Effort (Person-Months)',
                    data: [cachedC1Effort, cachedC2Effort],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Person-Months (PM)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

});
