// ==================== CONFIGURATION ====================
const API_BASE_URL = 'http://127.0.0.1:8000';
let charts = {};
let currentData = null;
let allDatasetData = [];
let currentPage = 1;
const pageSize = 50;
let datasetLoaded = false;
let activeFilters = {
    age_min: 0,
    age_max: 100,
    gender: 'all',
    hypertension: 'all',
    heart_disease: 'all',
    stroke: 'all',
    ever_married: 'all',
    work_type: 'all',
    Residence_type: 'all',
    glucose: 'all',
    bmi: 'all',
    smoking_status: 'all'
};

// ==================== THEME TOGGLE ====================
function initThemeToggle() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (!toggleBtn) return;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('strokeDashboardTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleBtn.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
    }
    
    toggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('strokeDashboardTheme', 'dark');
            toggleBtn.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
        } else {
            localStorage.setItem('strokeDashboardTheme', 'light');
            toggleBtn.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
        }
        
        // Recreate charts with new theme colors
        if (currentData) {
            initUnivariateSection();
            initBivariateSection();
            initMultivariateSection();
        }
    });
}

// ==================== BLUE & ORANGE COLOR PALETTE ====================
const chartColors = {
    blue: '#2E86C1',
    orange: '#E67E22',
    blueLight: 'rgba(46, 134, 193, 0.7)',
    orangeLight: 'rgba(230, 126, 34, 0.7)',
    blueSoft: 'rgba(46, 134, 193, 0.1)',
    orangeSoft: 'rgba(230, 126, 34, 0.1)',
    blueDark: '#1B4F72',
    orangeDark: '#B45F1B'
};

const darkChartColors = {
    blue: '#5DADE2',
    orange: '#F39C12',
    blueLight: 'rgba(93, 173, 226, 0.7)',
    orangeLight: 'rgba(243, 156, 18, 0.7)',
    blueSoft: 'rgba(93, 173, 226, 0.15)',
    orangeSoft: 'rgba(243, 156, 18, 0.15)',
    blueDark: '#2E86C1',
    orangeDark: '#E67E22'
};

function getChartColors() {
    return document.body.classList.contains('dark-mode') ? darkChartColors : chartColors;
}

// ==================== INITIALIZATION ====================
async function initDashboard() {
    showLoading();
    
    try {
        console.log('📡 Fetching data from API...');
        const response = await fetch(`${API_BASE_URL}/detailed-analysis`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        currentData = await response.json();
        console.log('✅ Data loaded:', currentData);
        
        // Initialize theme toggle
        initThemeToggle();
        
        // Initialize all sections
        updateStatsOverview();
        initUnivariateSection();
        initBivariateSection();
        initMultivariateSection();
        initFilters();
        
        hideLoading();
        showNotification('Dashboard loaded successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        hideLoading();
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// ==================== UNIVARIATE SECTION ====================
function initUnivariateSection() {
    createStrokeChart();
    createAgeChart();
}

function createStrokeChart() {
    const canvas = document.getElementById('strokeChart');
    if (!canvas) return;
    
    if (charts.strokeChart) charts.strokeChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.stroke_distribution;
    const strokeCount = data.counts['1'] || 0;
    const noStrokeCount = data.counts['0'] || 0;
    const strokePercent = data.percentages['1'].toFixed(1);
    const noStrokePercent = data.percentages['0'].toFixed(1);
    
    charts.strokeChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: [`No Stroke (${noStrokePercent}%)`, `Stroke (${strokePercent}%)`],
            datasets: [{
                data: [noStrokeCount, strokeCount],
                backgroundColor: [colors.blue, colors.orange],
                borderWidth: 3,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function createAgeChart() {
    const canvas = document.getElementById('ageChart');
    if (!canvas) return;
    
    if (charts.ageChart) charts.ageChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.age_distribution;
    
    charts.ageChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.bins,
            datasets: [
                {
                    label: 'No Stroke',
                    data: data.no_stroke_hist,
                    backgroundColor: colors.blueLight,
                    borderColor: colors.blue,
                    borderWidth: 1
                },
                {
                    label: 'Stroke',
                    data: data.stroke_hist,
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Number of patients' },
                    grid: { color: getChartColors().blueSoft }
                },
                x: { 
                    title: { display: true, text: 'Age groups' },
                    grid: { color: getChartColors().blueSoft }
                }
            },
            plugins: {
                tooltip: { mode: 'index' }
            }
        }
    });
}

// ==================== BIVARIATE SECTION ====================
function initBivariateSection() {
    createAgeChart_BS();
    createGlucoseChart();
    createBMIChart();
    createGenderChart();
    createHypertensionChart();
    createHeartDiseaseChart();
    createMarriedChart();
    createWorkTypeChart();
    createResidenceChart();
    createSmokingChart();
}

function createAgeChart_BS() {
    const canvas = document.getElementById('ageStrokeViolin');
    if (!canvas) return;
    
    if (charts.ageBoxplot) charts.ageBoxplot.destroy();
    
    const colors = getChartColors();
    const data = currentData.age_distribution;
    
    charts.ageBoxplot = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['No Stroke', 'Stroke'],
            datasets: [
                {
                    label: 'Average Age',
                    data: [data.no_stroke_mean.toFixed(0), data.stroke_mean.toFixed(0)],
                    backgroundColor: [colors.blueLight, colors.orangeLight],
                    borderColor: [colors.blue, colors.orange],
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Average Age by Stroke Status',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Age (years)' },
                    grid: { color: colors.blueSoft }
                }
            }
        }
    });
}

function createGlucoseChart() {
    const canvas = document.getElementById('glucoseStrokeChart');
    if (!canvas) return;
    
    if (charts.glucoseChart) charts.glucoseChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.glucose_categories;
    
    charts.glucoseChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.category),
            datasets: [
                {
                    label: 'Stroke Rate (%)',
                    data: data.map(d => d.stroke_rate),
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Patients',
                    data: data.map(d => d.total),
                    backgroundColor: 'transparent',
                    borderColor: colors.blue,
                    borderWidth: 2,
                    borderRadius: 6,
                    type: 'line',
                    yAxisID: 'y1',
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: 'white'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Glucose Levels vs Stroke',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Stroke Rate (%)' },
                    grid: { color: colors.blueSoft }
                },
                y1: { 
                    beginAtZero: true,
                    position: 'right',
                    title: { display: true, text: 'Patient Count' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function createBMIChart() {
    const canvas = document.getElementById('bmiStrokeChart');
    if (!canvas) return;
    
    if (charts.bmiChart) charts.bmiChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.bmi_categories;
    
    charts.bmiChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.category),
            datasets: [
                {
                    label: 'Stroke Rate (%)',
                    data: data.map(d => d.stroke_rate),
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Patients',
                    data: data.map(d => d.total),
                    backgroundColor: 'transparent',
                    borderColor: colors.blue,
                    borderWidth: 2,
                    borderRadius: 6,
                    type: 'line',
                    yAxisID: 'y1',
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: 'white'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'BMI Categories vs Stroke',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Stroke Rate (%)' },
                    grid: { color: colors.blueSoft }
                },
                y1: { 
                    beginAtZero: true,
                    position: 'right',
                    title: { display: true, text: 'Patient Count' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function createGenderChart() {
    const canvas = document.getElementById('genderStrokeChart');
    if (!canvas) return;
    
    if (charts.genderChart) charts.genderChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.categorical_distributions.gender.filter(d => d.gender !== 'Other');
    
    charts.genderChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Stroke Rate (%)',
                    data: data.map(d => (d.stroke_rate * 100).toFixed(1)),
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Patients',
                    data: data.map(d => d.total),
                    backgroundColor: 'transparent',
                    borderColor: colors.blue,
                    borderWidth: 2,
                    borderRadius: 6,
                    type: 'line',
                    yAxisID: 'y1',
                    pointRadius: 4,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: 'white'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Gender vs Stroke',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Stroke Rate (%)' },
                    grid: { color: colors.blueSoft }
                },
                y1: { 
                    beginAtZero: true,
                    position: 'right',
                    title: { display: true, text: 'Patient Count' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function createHypertensionChart() {
    const canvas = document.getElementById('hypertensionStrokeChart');
    if (!canvas) return;
    
    if (charts.hypertensionChart) charts.hypertensionChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.categorical_distributions.hypertension;
    
    charts.hypertensionChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Stroke Rate (%)',
                    data: data.map(d => (d.stroke_rate * 100).toFixed(1)),
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Patients',
                    data: data.map(d => d.total),
                    backgroundColor: 'transparent',
                    borderColor: colors.blue,
                    borderWidth: 2,
                    borderRadius: 6,
                    type: 'line',
                    yAxisID: 'y1',
                    pointRadius: 4,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: 'white'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Hypertension vs Stroke',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Stroke Rate (%)' },
                    grid: { color: colors.blueSoft }
                },
                y1: { 
                    beginAtZero: true,
                    position: 'right',
                    title: { display: true, text: 'Patient Count' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function createHeartDiseaseChart() {
    const canvas = document.getElementById('heartDiseaseStrokeChart');
    if (!canvas) return;
    
    if (charts.heartChart) charts.heartChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.categorical_distributions.heart_disease;
    
    charts.heartChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Stroke Rate (%)',
                    data: data.map(d => (d.stroke_rate * 100).toFixed(1)),
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Patients',
                    data: data.map(d => d.total),
                    backgroundColor: 'transparent',
                    borderColor: colors.blue,
                    borderWidth: 2,
                    borderRadius: 6,
                    type: 'line',
                    yAxisID: 'y1',
                    pointRadius: 4,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: 'white'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Heart Disease vs Stroke',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Stroke Rate (%)' },
                    grid: { color: colors.blueSoft }
                },
                y1: { 
                    beginAtZero: true,
                    position: 'right',
                    title: { display: true, text: 'Patient Count' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function createMarriedChart() {
    const canvas = document.getElementById('marriedStrokeChart');
    if (!canvas) return;
    
    if (charts.marriedChart) charts.marriedChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.categorical_distributions.ever_married;
    
    charts.marriedChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Stroke Rate (%)',
                    data: data.map(d => (d.stroke_rate * 100).toFixed(1)),
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Patients',
                    data: data.map(d => d.total),
                    backgroundColor: 'transparent',
                    borderColor: colors.blue,
                    borderWidth: 2,
                    borderRadius: 6,
                    type: 'line',
                    yAxisID: 'y1',
                    pointRadius: 4,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: 'white'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Marital Status vs Stroke',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Stroke Rate (%)' },
                    grid: { color: colors.blueSoft }
                },
                y1: { 
                    beginAtZero: true,
                    position: 'right',
                    title: { display: true, text: 'Patient Count' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function createWorkTypeChart() {
    const canvas = document.getElementById('workTypeStrokeChart');
    if (!canvas) return;
    
    if (charts.workChart) charts.workChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.categorical_distributions.work_type;
    
    charts.workChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Stroke Rate (%)',
                    data: data.map(d => (d.stroke_rate * 100).toFixed(1)),
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Patients',
                    data: data.map(d => d.total),
                    backgroundColor: 'transparent',
                    borderColor: colors.blue,
                    borderWidth: 2,
                    borderRadius: 6,
                    type: 'line',
                    yAxisID: 'y1',
                    pointRadius: 4,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: 'white'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Work Type vs Stroke',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Stroke Rate (%)' },
                    grid: { color: colors.blueSoft }
                },
                y1: { 
                    beginAtZero: true,
                    position: 'right',
                    title: { display: true, text: 'Patient Count' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function createResidenceChart() {
    const canvas = document.getElementById('residenceStrokeChart');
    if (!canvas) return;
    
    if (charts.residenceChart) charts.residenceChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.categorical_distributions.Residence_type;
    
    charts.residenceChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Stroke Rate (%)',
                    data: data.map(d => (d.stroke_rate * 100).toFixed(1)),
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Patients',
                    data: data.map(d => d.total),
                    backgroundColor: 'transparent',
                    borderColor: colors.blue,
                    borderWidth: 2,
                    borderRadius: 6,
                    type: 'line',
                    yAxisID: 'y1',
                    pointRadius: 4,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: 'white'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Residence Type vs Stroke',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Stroke Rate (%)' },
                    grid: { color: colors.blueSoft }
                },
                y1: { 
                    beginAtZero: true,
                    position: 'right',
                    title: { display: true, text: 'Patient Count' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function createSmokingChart() {
    const canvas = document.getElementById('smokingStrokeChart');
    if (!canvas) return;
    
    if (charts.smokingChart) charts.smokingChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.categorical_distributions.smoking_status;
    
    charts.smokingChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Stroke Rate (%)',
                    data: data.map(d => (d.stroke_rate * 100).toFixed(1)),
                    backgroundColor: colors.orangeLight,
                    borderColor: colors.orange,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Patients',
                    data: data.map(d => d.total),
                    backgroundColor: 'transparent',
                    borderColor: colors.blue,
                    borderWidth: 2,
                    borderRadius: 6,
                    type: 'line',
                    yAxisID: 'y1',
                    pointRadius: 4,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: 'white'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Smoking Status vs Stroke',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Stroke Rate (%)' },
                    grid: { color: colors.blueSoft }
                },
                y1: { 
                    beginAtZero: true,
                    position: 'right',
                    title: { display: true, text: 'Patient Count' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// ==================== MULTIVARIATE SECTION ====================
function initMultivariateSection() {
    createFeatureImportanceChart();
    createParallelCoordinatesChart();
}

function createFeatureImportanceChart() {
    const canvas = document.getElementById('importanceChart');
    if (!canvas) return;
    
    if (charts.importanceChart) charts.importanceChart.destroy();
    
    const colors = getChartColors();
    const data = currentData.feature_importance;
    const features = Object.keys(data);
    const scores = features.map(f => data[f].importance_score);
    const labels = features.map(f => {
        const translations = {
            'age': 'Age',
            'avg_glucose_level': 'Glucose',
            'bmi': 'BMI',
            'hypertension': 'Hypertension',
            'heart_disease': 'Heart Disease'
        };
        return translations[f] || f;
    });
    
    // Sort by importance
    const sortedIndices = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
    const sortedScores = sortedIndices.map(i => scores[i]);
    const sortedLabels = sortedIndices.map(i => labels[i]);
    
    charts.importanceChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: sortedLabels,
            datasets: [{
                label: 'Importance Score',
                data: sortedScores,
                backgroundColor: sortedScores.map(score => 
                    score > 80 ? colors.orange : 
                    score > 70 ? colors.blue : 
                    score > 60 ? '#48A9A5' : 
                    score > 50 ? '#FFB74D' : '#7BC950'
                ),
                borderColor: 'white',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Feature Importance for Stroke Prediction',
                    font: { size: 14, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                x: { 
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Importance Score (%)' },
                    grid: { color: colors.blueSoft }
                }
            }
        }
    });
}

function createParallelCoordinatesChart() {
    const canvas = document.getElementById('parallelCoordinatesChart');
    if (!canvas) return;
    
    if (charts.parallelChart) charts.parallelChart.destroy();
    
    const colors = getChartColors();
    const dimensions = ['Age', 'Glucose', 'BMI', 'Hypertension', 'Heart Disease'];
    const datasets = [];
    const palette = [colors.blue, colors.orange, '#48A9A5', '#FFB74D', '#7BC950', colors.blueDark, colors.orangeDark, '#307F7C'];
    
    for (let i = 0; i < 8; i++) {
        const age = 40 + Math.random() * 40;
        const glucose = 80 + Math.random() * 100;
        const bmi = 22 + Math.random() * 15;
        const hypertension = Math.random() > 0.8 ? 100 : 0;
        const heartDisease = Math.random() > 0.85 ? 100 : 0;
        
        const normalizedAge = ((age - 20) / 62) * 100;
        const normalizedGlucose = ((glucose - 55) / 215) * 100;
        const normalizedBMI = ((bmi - 15) / 35) * 100;
        
        datasets.push({
            label: `Patient ${i + 1}`,
            data: [
                Math.min(100, Math.max(0, normalizedAge)),
                Math.min(100, Math.max(0, normalizedGlucose)),
                Math.min(100, Math.max(0, normalizedBMI)),
                hypertension,
                heartDisease
            ],
            borderColor: palette[i % palette.length],
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: palette[i % palette.length],
            tension: 0.2
        });
    }
    
    charts.parallelChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: dimensions,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'Parallel Coordinates: Multidimensional Risk Factors',
                    font: { size: 14, weight: 'bold' }
                },
                legend: { 
                    display: true,
                    position: 'top',
                    labels: { boxWidth: 12 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            if (context.dataIndex === 3) {
                                return `${context.dataset.label}: ${value === 100 ? 'Yes' : 'No'} Hypertension`;
                            } else if (context.dataIndex === 4) {
                                return `${context.dataset.label}: ${value === 100 ? 'Yes' : 'No'} Heart Disease`;
                            }
                            return `${context.dataset.label}: ${Math.round(value)}%`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Normalized Value (%)' },
                    grid: { color: colors.blueSoft }
                }
            }
        }
    });
}

// ==================== STATS OVERVIEW ====================
function updateStatsOverview() {
    const container = document.getElementById('statsOverview');
    if (!container || !currentData.overview) return;
    
    const data = currentData.overview;
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-users"></i></div>
            <div class="stat-content">
                <div class="stat-value">${data.total_records}</div>
                <div class="stat-label">PATIENTS</div>
                <div class="stat-subtext">Stroke Rate: ${data.stroke_percentage}%</div>
            </div>
        </div>
        <div class="stat-card accent">
            <div class="stat-icon accent"><i class="fas fa-weight"></i></div>
            <div class="stat-content">
                <div class="stat-value">${data.avg_bmi}</div>
                <div class="stat-label">AVG BMI</div>
                <div class="stat-subtext">kg/m²</div>
            </div>
        </div>
        <div class="stat-card teal">
            <div class="stat-icon teal"><i class="fas fa-tint"></i></div>
            <div class="stat-content">
                <div class="stat-value">${data.avg_glucose}</div>
                <div class="stat-label">AVG GLUCOSE</div>
                <div class="stat-subtext">mg/dL</div>
            </div>
        </div>
        <div class="stat-card green">
            <div class="stat-icon green"><i class="fas fa-birthday-cake"></i></div>
            <div class="stat-content">
                <div class="stat-value">${data.avg_age}</div>
                <div class="stat-label">AVG AGE</div>
                <div class="stat-subtext">years</div>
            </div>
        </div>
    `;
}

// ==================== FILTERS ====================
function initFilters() {
    const minAge = document.getElementById('min-age');
    const maxAge = document.getElementById('max-age');
    
    if (minAge && maxAge) {
        minAge.addEventListener('change', function() {
            const min = parseInt(this.value) || 0;
            const max = parseInt(maxAge.value) || 100;
            if (min > max) maxAge.value = min;
        });
        
        maxAge.addEventListener('change', function() {
            const min = parseInt(minAge.value) || 0;
            const max = parseInt(this.value) || 100;
            if (max < min) minAge.value = max;
        });
    }
    
    updateActiveFiltersDisplay();
}

function getRadioValue(name) {
    const radio = document.querySelector(`input[name="${name}"]:checked`);
    return radio ? radio.value : 'all';
}

async function applyFilters() {
    showLoading();
    
    try {
        activeFilters = {
            age_min: parseInt(document.getElementById('min-age')?.value) || 0,
            age_max: parseInt(document.getElementById('max-age')?.value) || 100,
            gender: getRadioValue('gender'),
            hypertension: getRadioValue('hypertension'),
            heart_disease: getRadioValue('heart_disease'),
            stroke: getRadioValue('stroke'),
            ever_married: getRadioValue('ever_married'),
            work_type: getRadioValue('work_type'),
            Residence_type: getRadioValue('Residence_type'),
            glucose: getRadioValue('glucose'),
            bmi: getRadioValue('bmi'),
            smoking_status: getRadioValue('smoking_status')
        };
        
        console.log('🔍 Active Filters:', activeFilters);
        
        const params = new URLSearchParams();
        
        if (activeFilters.age_min > 0) params.append('age_min', activeFilters.age_min);
        if (activeFilters.age_max < 100) params.append('age_max', activeFilters.age_max);
        if (activeFilters.gender !== 'all') params.append('gender', activeFilters.gender);
        if (activeFilters.hypertension !== 'all') {
            params.append('hypertension', activeFilters.hypertension === '1' ? 'true' : 'false');
        }
        if (activeFilters.heart_disease !== 'all') {
            params.append('heart_disease', activeFilters.heart_disease === '1' ? 'true' : 'false');
        }
        if (activeFilters.stroke !== 'all') {
            params.append('stroke', activeFilters.stroke);
        }
        if (activeFilters.ever_married !== 'all') {
            params.append('ever_married', activeFilters.ever_married);
        }
        if (activeFilters.work_type !== 'all') {
            params.append('work_type', activeFilters.work_type);
        }
        if (activeFilters.Residence_type !== 'all') {
            params.append('Residence_type', activeFilters.Residence_type);
        }
        if (activeFilters.smoking_status !== 'all') {
            params.append('smoking_status', activeFilters.smoking_status);
        }
        
        if (activeFilters.glucose !== 'all') {
            switch(activeFilters.glucose) {
                case 'low':
                    params.append('glucose_min', 0);
                    params.append('glucose_max', 70);
                    break;
                case 'normal':
                    params.append('glucose_min', 70);
                    params.append('glucose_max', 100);
                    break;
                case 'prediabetes':
                    params.append('glucose_min', 100);
                    params.append('glucose_max', 125);
                    break;
                case 'diabetes':
                    params.append('glucose_min', 125);
                    params.append('glucose_max', 200);
                    break;
                case 'severe':
                    params.append('glucose_min', 200);
                    params.append('glucose_max', 300);
                    break;
            }
        }
        
        if (activeFilters.bmi !== 'all') {
            switch(activeFilters.bmi) {
                case 'underweight':
                    params.append('bmi_min', 0);
                    params.append('bmi_max', 18.5);
                    break;
                case 'normal':
                    params.append('bmi_min', 18.5);
                    params.append('bmi_max', 25);
                    break;
                case 'overweight':
                    params.append('bmi_min', 25);
                    params.append('bmi_max', 30);
                    break;
                case 'obese1':
                    params.append('bmi_min', 30);
                    params.append('bmi_max', 35);
                    break;
                case 'obese2':
                    params.append('bmi_min', 35);
                    params.append('bmi_max', 40);
                    break;
                case 'obese3':
                    params.append('bmi_min', 40);
                    params.append('bmi_max', 100);
                    break;
            }
        }
        
        const url = params.toString() ? `/filtered-analysis?${params}` : '/detailed-analysis';
        console.log('📡 Fetching filtered data:', url);
        
        const response = await fetch(`${API_BASE_URL}${url}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        currentData = await response.json();
        console.log('✅ Filtered data loaded:', currentData);
        
        updateStatsOverview();
        initUnivariateSection();
        initBivariateSection();
        initMultivariateSection();
        updateActiveFiltersDisplay();
        
        hideLoading();
        showNotification('Filters applied successfully', 'success');
        
    } catch (error) {
        console.error('❌ Filter error:', error);
        hideLoading();
        showNotification('Error applying filters: ' + error.message, 'error');
    }
}

function resetFilters() {
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (radio.value === 'all') {
            radio.checked = true;
        }
    });
    
    const minAge = document.getElementById('min-age');
    const maxAge = document.getElementById('max-age');
    if (minAge) minAge.value = 0;
    if (maxAge) maxAge.value = 100;
    
    activeFilters = {
        age_min: 0,
        age_max: 100,
        gender: 'all',
        hypertension: 'all',
        heart_disease: 'all',
        stroke: 'all',
        ever_married: 'all',
        work_type: 'all',
        Residence_type: 'all',
        glucose: 'all',
        bmi: 'all',
        smoking_status: 'all'
    };
    
    applyFilters();
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFiltersContainer');
    const tagsDiv = document.getElementById('activeFiltersTags');
    
    if (!container || !tagsDiv) return;
    
    let filters = [];
    
    if (activeFilters.age_min > 0 || activeFilters.age_max < 100) {
        filters.push({
            text: `Age: ${activeFilters.age_min}-${activeFilters.age_max}`,
            type: 'age'
        });
    }
    
    if (activeFilters.gender !== 'all') {
        filters.push({
            text: `Gender: ${activeFilters.gender}`,
            type: 'gender'
        });
    }
    
    if (activeFilters.hypertension !== 'all') {
        filters.push({
            text: `Hypertension: ${activeFilters.hypertension === '1' ? 'Yes' : 'No'}`,
            type: 'hypertension'
        });
    }
    
    if (activeFilters.heart_disease !== 'all') {
        filters.push({
            text: `Heart Disease: ${activeFilters.heart_disease === '1' ? 'Yes' : 'No'}`,
            type: 'heart'
        });
    }
    
    if (activeFilters.stroke !== 'all') {
        filters.push({
            text: `Stroke: ${activeFilters.stroke === '1' ? 'Yes' : 'No'}`,
            type: 'stroke'
        });
    }
    
    if (activeFilters.ever_married !== 'all') {
        filters.push({
            text: `Married: ${activeFilters.ever_married === 'Yes' ? 'Yes' : 'No'}`,
            type: 'married'
        });
    }
    
    if (activeFilters.work_type !== 'all') {
        let workLabel = activeFilters.work_type;
        if (workLabel === 'Govt_job') workLabel = 'Govt Job';
        if (workLabel === 'Never_worked') workLabel = 'Never worked';
        if (workLabel === 'Self-employed') workLabel = 'Self-employed';
        filters.push({
            text: `Work: ${workLabel}`,
            type: 'work'
        });
    }
    
    if (activeFilters.Residence_type !== 'all') {
        filters.push({
            text: `Residence: ${activeFilters.Residence_type}`,
            type: 'residence'
        });
    }
    
    if (activeFilters.glucose !== 'all') {
        let glucoseLabel = '';
        switch(activeFilters.glucose) {
            case 'low': glucoseLabel = 'Low (<70)'; break;
            case 'normal': glucoseLabel = 'Normal (70-100)'; break;
            case 'prediabetes': glucoseLabel = 'Pre-diabetes (100-125)'; break;
            case 'diabetes': glucoseLabel = 'Diabetes (125-200)'; break;
            case 'severe': glucoseLabel = 'Severe (>200)'; break;
        }
        filters.push({
            text: `Glucose: ${glucoseLabel}`,
            type: 'glucose'
        });
    }
    
    if (activeFilters.bmi !== 'all') {
        let bmiLabel = '';
        switch(activeFilters.bmi) {
            case 'underweight': bmiLabel = 'Underweight'; break;
            case 'normal': bmiLabel = 'Normal'; break;
            case 'overweight': bmiLabel = 'Overweight'; break;
            case 'obese1': bmiLabel = 'Obese I'; break;
            case 'obese2': bmiLabel = 'Obese II'; break;
            case 'obese3': bmiLabel = 'Obese III'; break;
        }
        filters.push({
            text: `BMI: ${bmiLabel}`,
            type: 'bmi'
        });
    }
    
    if (activeFilters.smoking_status !== 'all') {
        let smokingLabel = activeFilters.smoking_status;
        if (smokingLabel === 'formerly smoked') smokingLabel = 'Former smoker';
        if (smokingLabel === 'never smoked') smokingLabel = 'Never smoked';
        if (smokingLabel === 'smokes') smokingLabel = 'Current smoker';
        if (smokingLabel === 'Unknown') smokingLabel = 'Unknown';
        filters.push({
            text: `Smoking: ${smokingLabel}`,
            type: 'smoking'
        });
    }
    
    if (filters.length > 0) {
        tagsDiv.innerHTML = filters.map(filter => `
            <div class="active-filter-tag">
                ${filter.text}
                <i class="fas fa-times" onclick="removeFilter('${filter.type}')"></i>
            </div>
        `).join('');
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function removeFilter(type) {
    switch(type) {
        case 'age':
            document.getElementById('min-age').value = 0;
            document.getElementById('max-age').value = 100;
            break;
        case 'gender':
            document.getElementById('gender-all').checked = true;
            break;
        case 'hypertension':
            document.getElementById('hyper-all').checked = true;
            break;
        case 'heart':
            document.getElementById('heart-all').checked = true;
            break;
        case 'stroke':
            document.getElementById('stroke-all').checked = true;
            break;
        case 'married':
            document.getElementById('married-all').checked = true;
            break;
        case 'work':
            document.getElementById('work-all').checked = true;
            break;
        case 'residence':
            document.getElementById('res-all').checked = true;
            break;
        case 'glucose':
            document.getElementById('glucose-all').checked = true;
            break;
        case 'bmi':
            document.getElementById('bmi-all').checked = true;
            break;
        case 'smoking':
            document.getElementById('smoke-all').checked = true;
            break;
    }
    applyFilters();
}

// ==================== DATASET VIEWER ====================
async function loadFullDataset() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/full-dataset`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allDatasetData = await response.json();
        datasetLoaded = true;
        loadDatasetPage(1);
        hideLoading();
        showNotification(`${allDatasetData.length.toLocaleString()} patients loaded`, 'success');
    } catch (error) {
        console.error('Error loading dataset:', error);
        hideLoading();
        showNotification('Error loading data: ' + error.message, 'error');
    }
}

function loadDatasetPage(page) {
    currentPage = page;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageData = allDatasetData.slice(start, end);
    
    const tbody = document.getElementById('datasetBody');
    if (!tbody) return;
    
    tbody.innerHTML = pageData.map((item, i) => `
        <tr>
            <td>${start + i + 1}</td>
            <td>${item.gender || '-'}</td>
            <td>${Math.round(item.age) || '-'}</td>
            <td>${item.hypertension ? 'Yes' : 'No'}</td>
            <td>${item.heart_disease ? 'Yes' : 'No'}</td>
            <td>${item.ever_married === 'Yes' ? 'Yes' : 'No'}</td>
            <td>${translateWorkType(item.work_type)}</td>
            <td>${item.Residence_type || '-'}</td>
            <td>${item.avg_glucose_level ? item.avg_glucose_level.toFixed(1) : '-'}</td>
            <td>${item.bmi ? item.bmi.toFixed(1) : '-'}</td>
            <td>${translateSmoking(item.smoking_status)}</td>
            <td><span class="badge ${item.stroke ? 'badge-accent' : 'badge-primary'}">${item.stroke ? 'Stroke' : 'No'}</span></td>
        </tr>
    `).join('');
    
    const totalPages = Math.ceil(allDatasetData.length / pageSize);
    document.getElementById('pageInfo').textContent = `Page ${page} of ${totalPages}`;
    document.getElementById('prevBtn').disabled = page === 1;
    document.getElementById('nextBtn').disabled = page >= totalPages;
}

function searchDataset() {
    const searchTerm = document.getElementById('datasetSearch')?.value.toLowerCase().trim();
    if (!searchTerm) {
        loadDatasetPage(1);
        return;
    }
    
    const filtered = allDatasetData.filter(item => 
        Object.values(item).some(value => 
            String(value).toLowerCase().includes(searchTerm)
        )
    );
    
    const tbody = document.getElementById('datasetBody');
    if (!tbody) return;
    
    tbody.innerHTML = filtered.slice(0, pageSize).map((item, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${item.gender || '-'}</td>
            <td>${Math.round(item.age) || '-'}</td>
            <td>${item.hypertension ? 'Yes' : 'No'}</td>
            <td>${item.heart_disease ? 'Yes' : 'No'}</td>
            <td>${item.ever_married === 'Yes' ? 'Yes' : 'No'}</td>
            <td>${translateWorkType(item.work_type)}</td>
            <td>${item.Residence_type || '-'}</td>
            <td>${item.avg_glucose_level ? item.avg_glucose_level.toFixed(1) : '-'}</td>
            <td>${item.bmi ? item.bmi.toFixed(1) : '-'}</td>
            <td>${translateSmoking(item.smoking_status)}</td>
            <td><span class="badge ${item.stroke ? 'badge-accent' : 'badge-primary'}">${item.stroke ? 'Stroke' : 'No'}</span></td>
        </tr>
    `).join('');
    
    document.getElementById('pageInfo').textContent = `${filtered.length} result(s) found`;
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
}

function previousPage() {
    if (currentPage > 1) loadDatasetPage(currentPage - 1);
}

function nextPage() {
    if ((currentPage * pageSize) < allDatasetData.length) loadDatasetPage(currentPage + 1);
}

function exportDataset() {
    if (!allDatasetData.length) {
        showNotification('No data to export', 'error');
        return;
    }
    
    const headers = ['ID', 'Gender', 'Age', 'Hypertension', 'Heart Disease', 'Married', 'Work', 'Residence', 'Glucose', 'BMI', 'Smoking', 'Stroke'];
    const csv = [
        headers.join(','),
        ...allDatasetData.map((item, i) => [
            i + 1,
            item.gender || '',
            Math.round(item.age) || '',
            item.hypertension ? 'Yes' : 'No',
            item.heart_disease ? 'Yes' : 'No',
            item.ever_married === 'Yes' ? 'Yes' : 'No',
            translateWorkType(item.work_type),
            item.Residence_type || '',
            item.avg_glucose_level ? item.avg_glucose_level.toFixed(1) : '',
            item.bmi ? item.bmi.toFixed(1) : '',
            translateSmoking(item.smoking_status),
            item.stroke ? 'Stroke' : 'No'
        ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stroke_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('Data exported successfully', 'success');
}

// ==================== UTILITIES ====================
function translateWorkType(type) {
    const translations = {
        'Private': 'Private',
        'Self-employed': 'Self-employed',
        'Govt_job': 'Govt Job',
        'children': 'Child',
        'Never_worked': 'Never worked'
    };
    return translations[type] || type || 'Unknown';
}

function translateSmoking(status) {
    const translations = {
        'formerly smoked': 'Former smoker',
        'smokes': 'Current smoker',
        'never smoked': 'Never smoked',
        'Unknown': 'Unknown'
    };
    return translations[status] || status || 'Unknown';
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.charts-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const tab = document.getElementById(`${tabName}-tab`);
    if (tab) {
        tab.classList.add('active');
        if (tabName === 'dataset' && !datasetLoaded && allDatasetData.length === 0) {
            loadFullDataset();
        }
    }
}

// Start dashboard
document.addEventListener('DOMContentLoaded', initDashboard);