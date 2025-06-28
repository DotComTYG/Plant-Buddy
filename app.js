// Plant Buddy App - Main JavaScript File

// Helper to parse YYYY-MM-DD as local date
function parseLocalDate(dateString) {
    if (!dateString) return new Date(NaN);
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

class PlantBuddy {
    constructor() {
        this.plants = JSON.parse(localStorage.getItem('plants')) || [];
        this.currentPlantId = null;
        this.plantTypesChart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.renderPlants();
        this.updateStats();
        this.updateDashboard();
        
        // Show dashboard as default screen
        this.showSection('dashboardSection');
        this.updateActiveTab('dashboardTab');
        
        // Debug: Check if quick action buttons exist
        console.log('Checking quick action buttons...');
        console.log('Water All Btn:', document.getElementById('waterAllBtn'));
        console.log('Add Plant Btn:', document.getElementById('addPlantFromDashboardBtn'));
        console.log('Export Data Btn:', document.getElementById('exportDataBtn'));
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('plantsTab').addEventListener('click', () => {
            this.showSection('plantsSection');
            this.updateActiveTab('plantsTab');
        });

        document.getElementById('dashboardTab').addEventListener('click', () => {
            this.showSection('dashboardSection');
            this.updateActiveTab('dashboardTab');
            this.updateDashboard();
        });

        // Add plant button
        document.getElementById('addPlantBtn').addEventListener('click', () => {
            this.showModal('addPlantModal');
        });

        // Close modals
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal('addPlantModal');
        });

        document.getElementById('closeDetailModal').addEventListener('click', () => {
            this.hideModal('plantDetailModal');
        });

        // Cancel add plant
        document.getElementById('cancelAdd').addEventListener('click', () => {
            this.hideModal('addPlantModal');
        });

        // Add plant form
        document.getElementById('addPlantForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPlant();
        });

        // Dynamic plant type selection
        document.getElementById('plantType').addEventListener('change', (e) => {
            const customTypeGroup = document.getElementById('customTypeGroup');
            const customPlantType = document.getElementById('customPlantType');
            
            if (e.target.value === 'other') {
                customTypeGroup.style.display = 'block';
                customPlantType.required = true;
            } else {
                customTypeGroup.style.display = 'none';
                customPlantType.required = false;
                customPlantType.value = '';
            }
        });

        // Plant actions
        document.getElementById('waterPlantBtn').addEventListener('click', () => {
            this.waterPlant();
        });

        document.getElementById('editPlantBtn').addEventListener('click', () => {
            this.editPlant();
        });

        document.getElementById('deletePlantBtn').addEventListener('click', () => {
            this.deletePlant();
        });

        // Setup quick action buttons with retry mechanism
        this.setupQuickActionButtons();

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Edit plant
        document.getElementById('closeEditModal').addEventListener('click', () => {
            this.hideModal('editPlantModal');
        });
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.hideModal('editPlantModal');
        });
        document.getElementById('editPlantType').addEventListener('change', (e) => {
            const editCustomTypeGroup = document.getElementById('editCustomTypeGroup');
            const editCustomPlantType = document.getElementById('editCustomPlantType');
            if (e.target.value === 'other') {
                editCustomTypeGroup.style.display = 'block';
                editCustomPlantType.required = true;
            } else {
                editCustomTypeGroup.style.display = 'none';
                editCustomPlantType.required = false;
                editCustomPlantType.value = '';
            }
        });
        document.getElementById('editPlantForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedPlant();
        });
    }

    setupQuickActionButtons() {
        // Dashboard quick actions
        const waterAllBtn = document.getElementById('waterAllBtn');
        const addPlantBtn = document.getElementById('addPlantFromDashboardBtn');
        const exportDataBtn = document.getElementById('exportDataBtn');

        if (waterAllBtn) {
            waterAllBtn.addEventListener('click', () => {
                console.log('Water All Plants button clicked!');
                this.showQuickWaterModal();
            });
            console.log('Water All button event listener attached');
        } else {
            console.log('Water All button not found, will retry...');
            setTimeout(() => this.setupQuickActionButtons(), 100);
        }

        if (addPlantBtn) {
            addPlantBtn.addEventListener('click', () => {
                console.log('Add Plant from Dashboard button clicked!');
                this.showModal('addPlantModal');
            });
            console.log('Add Plant button event listener attached');
        } else {
            console.log('Add Plant button not found, will retry...');
            setTimeout(() => this.setupQuickActionButtons(), 100);
        }

        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                console.log('Export Data button clicked!');
                this.exportData();
            });
            console.log('Export Data button event listener attached');
        } else {
            console.log('Export Data button not found, will retry...');
            setTimeout(() => this.setupQuickActionButtons(), 100);
        }
    }

    setDefaultDate() {
        // Use local date instead of UTC to avoid timezone issues
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        
        const lastWateredInput = document.getElementById('lastWatered');
        const editLastWateredInput = document.getElementById('editLastWatered');
        
        // Set default date to today
        if (lastWateredInput) {
            lastWateredInput.value = todayString;
            lastWateredInput.max = todayString; // Prevent future dates
        }
        
        if (editLastWateredInput) {
            editLastWateredInput.max = todayString; // Prevent future dates
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    addPlant() {
        const formData = new FormData(document.getElementById('addPlantForm'));
        const plantType = formData.get('plantType');
        const customPlantType = formData.get('customPlantType');
        const lastWatered = formData.get('lastWatered');
        
        // Validate that last watered date is not in the future
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        
        if (lastWatered > todayString) {
            this.showNotification('Last watered date cannot be in the future!', 'error');
            return;
        }
        
        const plant = {
            id: Date.now().toString(),
            name: formData.get('plantName'),
            type: plantType === 'other' ? customPlantType : plantType,
            description: formData.get('plantDescription'),
            wateringFrequency: parseInt(formData.get('wateringFrequency')),
            lastWatered: lastWatered,
            notes: formData.get('plantNotes'),
            createdAt: new Date().toISOString()
        };

        this.plants.push(plant);
        this.savePlants();
        this.renderPlants();
        this.updateStats();
        this.updateDashboard();
        this.hideModal('addPlantModal');
        this.resetForm();

        // Show success message
        this.showNotification('Plant added successfully! 🌱', 'success');
    }

    resetForm() {
        document.getElementById('addPlantForm').reset();
        document.getElementById('customTypeGroup').style.display = 'none';
        document.getElementById('customPlantType').required = false;
        this.setDefaultDate();
    }

    renderPlants() {
        const plantsGrid = document.getElementById('plantsGrid');
        
        if (this.plants.length === 0) {
            plantsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-seedling"></i>
                    <h3>No plants yet!</h3>
                    <p>Start your plant collection by adding your first plant.</p>
                    <button class="nav-btn add-plant-btn" id="addFirstPlantBtn">
                        <i class="fas fa-plus"></i>
                        Add Your First Plant
                    </button>
                </div>
            `;
            
            // Add event listener to the empty state button
            document.getElementById('addFirstPlantBtn').addEventListener('click', () => {
                this.showModal('addPlantModal');
            });
            
            return;
        }

        plantsGrid.innerHTML = this.plants.map(plant => this.createPlantCard(plant)).join('');
        
        // Add click listeners to plant cards
        document.querySelectorAll('.plant-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showPlantDetails(this.plants[index]);
            });
        });
    }

    createPlantCard(plant) {
        const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
        const needsWater = daysSinceWatered >= plant.wateringFrequency;
        const progressPercentage = Math.max(100 - Math.min((daysSinceWatered / plant.wateringFrequency) * 100, 100), 0);
        
        const statusClass = needsWater ? 'needs-water' : 'watered';
        const statusText = needsWater ? 'Needs Water' : 'Watered';
        const progressClass = needsWater ? 'dry' : '';

        return `
            <div class="plant-card ${needsWater ? 'needs-water' : ''}" data-plant-id="${plant.id}">
                <div class="plant-header">
                    <div>
                        <div class="plant-name">${plant.name}</div>
                        <div class="plant-type">${plant.type}</div>
                    </div>
                    <div class="plant-status ${statusClass}">${statusText}</div>
                </div>
                
                ${plant.description ? `
                <div class="plant-description">
                    <p>${plant.description}</p>
                </div>
                ` : ''}
                
                <div class="plant-info">
                    <div class="info-row">
                        <span class="info-label">Last Watered:</span>
                        <span class="info-value">${this.formatDate(plant.lastWatered)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Frequency:</span>
                        <span class="info-value">${plant.wateringFrequency} days</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Days Since:</span>
                        <span class="info-value">${daysSinceWatered} days</span>
                    </div>
                </div>
                
                <div class="water-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Water Progress</span>
                        <span class="info-value">${Math.round(progressPercentage)}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    showPlantDetails(plant) {
        this.currentPlantId = plant.id;
        const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
        const needsWater = daysSinceWatered >= plant.wateringFrequency;

        document.getElementById('detailPlantName').textContent = plant.name;
        
        document.getElementById('plantDetails').innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Plant Type:</span>
                <span class="detail-value">${plant.type}</span>
            </div>
            ${plant.description ? `
            <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${plant.description}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">Watering Frequency:</span>
                <span class="detail-value">${plant.wateringFrequency} days</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Last Watered:</span>
                <span class="detail-value">${this.formatDate(plant.lastWatered)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Days Since Watering:</span>
                <span class="detail-value">${daysSinceWatered} days</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value ${needsWater ? 'needs-water' : 'watered'}">${needsWater ? 'Needs Water' : 'Well Watered'}</span>
            </div>
            ${plant.notes ? `
            <div class="detail-row">
                <span class="detail-label">Care Notes:</span>
                <span class="detail-value">${plant.notes}</span>
            </div>
            ` : ''}
        `;

        // Update water button text
        const waterBtn = document.getElementById('waterPlantBtn');
        waterBtn.innerHTML = needsWater ? 
            '<i class="fas fa-tint"></i> Water Plant' : 
            '<i class="fas fa-tint"></i> Water Again';

        this.showModal('plantDetailModal');
    }

    waterPlant() {
        if (!this.currentPlantId) return;

        const plantIndex = this.plants.findIndex(p => p.id === this.currentPlantId);
        if (plantIndex === -1) return;

        this.plants[plantIndex].lastWatered = new Date().toISOString().split('T')[0];
        this.savePlants();
        this.renderPlants();
        this.updateStats();
        this.updateDashboard();
        this.hideModal('plantDetailModal');

        this.showNotification('Plant watered! 💧', 'success');
    }

    editPlant() {
        if (!this.currentPlantId) return;
        // Hide the plant detail modal before showing the edit modal
        this.hideModal('plantDetailModal');
        const plant = this.plants.find(p => p.id === this.currentPlantId);
        if (!plant) return;

        // Fill the edit form with plant data
        document.getElementById('editPlantName').value = plant.name;
        document.getElementById('editPlantType').value = [
            'succulent', 'tropical', 'herb', 'flowering', 'cactus'
        ].includes(plant.type) ? plant.type : 'other';
        document.getElementById('editCustomPlantType').value = ![
            'succulent', 'tropical', 'herb', 'flowering', 'cactus'
        ].includes(plant.type) ? plant.type : '';
        document.getElementById('editPlantDescription').value = plant.description || '';
        document.getElementById('editWateringFrequency').value = plant.wateringFrequency;
        document.getElementById('editLastWatered').value = plant.lastWatered;
        document.getElementById('editPlantNotes').value = plant.notes || '';

        // Show/hide custom type group
        const editCustomTypeGroup = document.getElementById('editCustomTypeGroup');
        if (document.getElementById('editPlantType').value === 'other') {
            editCustomTypeGroup.style.display = 'block';
            document.getElementById('editCustomPlantType').required = true;
        } else {
            editCustomTypeGroup.style.display = 'none';
            document.getElementById('editCustomPlantType').required = false;
        }

        this.showModal('editPlantModal');
    }

    deletePlant() {
        if (!this.currentPlantId) return;

        if (confirm('Are you sure you want to delete this plant? This action cannot be undone.')) {
            this.plants = this.plants.filter(p => p.id !== this.currentPlantId);
            this.savePlants();
            this.renderPlants();
            this.updateStats();
            this.updateDashboard();
            this.hideModal('plantDetailModal');

            this.showNotification('Plant removed from collection 🌿', 'success');
        }
    }

    updateStats() {
        const totalPlants = this.plants.length;
        const needsWater = this.plants.filter(plant => 
            this.getDaysSinceWatered(plant.lastWatered) >= plant.wateringFrequency
        ).length;
        const wateredToday = this.plants.filter(plant => 
            plant.lastWatered === new Date().toISOString().split('T')[0]
        ).length;
        const healthyPlants = this.plants.filter(plant => {
            const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
            return daysSinceWatered < plant.wateringFrequency * 0.8;
        }).length;

        document.getElementById('totalPlants').textContent = totalPlants;
        document.getElementById('needsWater').textContent = needsWater;
        document.getElementById('wateredToday').textContent = wateredToday;
        document.getElementById('healthyPlants').textContent = healthyPlants;
    }

    getDaysSinceWatered(lastWatered) {
        const lastWateredDate = parseLocalDate(lastWatered);
        const today = new Date();
        // Zero out time for today
        today.setHours(0,0,0,0);
        const diffTime = Math.abs(today - lastWateredDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    formatDate(dateString) {
        const date = parseLocalDate(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    savePlants() {
        localStorage.setItem('plants', JSON.stringify(this.plants));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles with nature-inspired colors
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#8fbc8f' : type === 'error' ? '#d2691e' : '#4a6741'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(45, 74, 62, 0.2);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        `;

        notification.querySelector('.notification-close').style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Close functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(sectionId).classList.add('active');
    }

    updateActiveTab(activeTabId) {
        // Remove active class from all tabs
        document.querySelectorAll('.nav-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to selected tab
        document.getElementById(activeTabId).classList.add('active');
    }

    updateDashboard() {
        this.updatePlantTypesChart();
        this.updateWateringSchedule();
        this.updateHealthOverview();
        this.updateRecentActivity();
        this.updateCollectionStats();
    }

    updatePlantTypesChart() {
        const ctx = document.getElementById('plantTypesChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.plantTypesChart) {
            this.plantTypesChart.destroy();
        }

        // Count plant types
        const typeCounts = {};
        this.plants.forEach(plant => {
            typeCounts[plant.type] = (typeCounts[plant.type] || 0) + 1;
        });

        const labels = Object.keys(typeCounts);
        const data = Object.values(typeCounts);

        // Nature-inspired colors
        const colors = [
            '#8fbc8f', '#6b8e23', '#4a6741', '#2d4a3e', 
            '#d2691e', '#cd853f', '#daa520', '#b8860b'
        ];

        this.plantTypesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#f8f6f0',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#2d4a3e',
                            font: {
                                size: 12
                            },
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    updateWateringSchedule() {
        const scheduleContainer = document.getElementById('wateringSchedule');
        if (!scheduleContainer) return;

        // Get next 7 days of watering schedule
        const schedule = [];
        const today = new Date();

        this.plants.forEach(plant => {
            const lastWatered = new Date(plant.lastWatered);
            const nextWatering = new Date(lastWatered);
            nextWatering.setDate(lastWatered.getDate() + plant.wateringFrequency);

            // Only show plants that need watering in the next 7 days
            const daysUntilWatering = Math.ceil((nextWatering - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilWatering <= 7) {
                schedule.push({
                    plant: plant,
                    nextWatering: nextWatering,
                    daysUntil: daysUntilWatering,
                    isUrgent: daysUntilWatering <= 0
                });
            }
        });

        // Sort by urgency (urgent first, then by days until watering)
        schedule.sort((a, b) => {
            if (a.isUrgent && !b.isUrgent) return -1;
            if (!a.isUrgent && b.isUrgent) return 1;
            return a.daysUntil - b.daysUntil;
        });

        if (schedule.length === 0) {
            scheduleContainer.innerHTML = `
                <div class="schedule-item">
                    <div class="schedule-info">
                        <div class="schedule-plant-name">No plants need watering soon</div>
                        <div class="schedule-date">All plants are well cared for!</div>
                    </div>
                    <div class="schedule-status normal">Good</div>
                </div>
            `;
            return;
        }

        scheduleContainer.innerHTML = schedule.map(item => `
            <div class="schedule-item ${item.isUrgent ? 'urgent' : ''}">
                <div class="schedule-info">
                    <div class="schedule-plant-name">${item.plant.name}</div>
                    <div class="schedule-date">
                        ${item.isUrgent ? 'Needs water now!' : `Water in ${item.daysUntil} day${item.daysUntil !== 1 ? 's' : ''}`}
                    </div>
                </div>
                <div class="schedule-status ${item.isUrgent ? 'urgent' : 'normal'}">
                    ${item.isUrgent ? 'Urgent' : 'Normal'}
                </div>
            </div>
        `).join('');
    }

    updateHealthOverview() {
        const healthyCount = this.plants.filter(plant => {
            const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
            return daysSinceWatered < plant.wateringFrequency * 0.8;
        }).length;

        const warningCount = this.plants.filter(plant => {
            const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
            return daysSinceWatered >= plant.wateringFrequency * 0.8 && daysSinceWatered < plant.wateringFrequency;
        }).length;

        const criticalCount = this.plants.filter(plant => {
            const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
            return daysSinceWatered >= plant.wateringFrequency;
        }).length;

        document.getElementById('healthyCount').textContent = healthyCount;
        document.getElementById('warningCount').textContent = warningCount;
        document.getElementById('criticalCount').textContent = criticalCount;
    }

    updateRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;

        // Create activity log from plant data
        const activities = [];
        
        this.plants.forEach(plant => {
            // Add plant creation activity
            activities.push({
                type: 'plant_added',
                text: `Added ${plant.name} to collection`,
                time: new Date(plant.createdAt),
                icon: 'fas fa-seedling'
            });

            // Add watering activity
            activities.push({
                type: 'plant_watered',
                text: `Watered ${plant.name}`,
                time: new Date(plant.lastWatered),
                icon: 'fas fa-tint'
            });
        });

        // Sort by time (most recent first) and take top 10
        activities.sort((a, b) => b.time - a.time);
        const recentActivities = activities.slice(0, 10);

        if (recentActivities.length === 0) {
            activityContainer.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-info">
                        <div class="activity-text">No recent activity</div>
                        <div class="activity-time">Add some plants to see activity here</div>
                    </div>
                </div>
            `;
            return;
        }

        activityContainer.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-info">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${this.formatRelativeTime(activity.time)}</div>
                </div>
            </div>
        `).join('');
    }

    updateCollectionStats() {
        if (this.plants.length === 0) {
            document.getElementById('avgWateringFreq').textContent = '0 days';
            document.getElementById('mostCommonType').textContent = '-';
            document.getElementById('oldestPlant').textContent = '-';
            document.getElementById('newestPlant').textContent = '-';
            return;
        }

        // Average watering frequency
        const avgFreq = Math.round(
            this.plants.reduce((sum, plant) => sum + plant.wateringFrequency, 0) / this.plants.length
        );
        document.getElementById('avgWateringFreq').textContent = `${avgFreq} days`;

        // Most common type
        const typeCounts = {};
        this.plants.forEach(plant => {
            typeCounts[plant.type] = (typeCounts[plant.type] || 0) + 1;
        });
        const mostCommon = Object.keys(typeCounts).reduce((a, b) => 
            typeCounts[a] > typeCounts[b] ? a : b
        );
        document.getElementById('mostCommonType').textContent = mostCommon;

        // Oldest and newest plants
        const sortedByDate = [...this.plants].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        );
        document.getElementById('oldestPlant').textContent = sortedByDate[0].name;
        document.getElementById('newestPlant').textContent = sortedByDate[sortedByDate.length - 1].name;
    }

    showQuickWaterModal() {
        const plantsNeedingWater = this.plants.filter(plant => {
            const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
            return daysSinceWatered >= plant.wateringFrequency;
        });

        if (plantsNeedingWater.length === 0) {
            this.showNotification('All plants are already well watered! 💧', 'info');
            return;
        }

        // Create modal content
        const modalContent = `
            <div class="modal-header">
                <h2>Quick Water Plants</h2>
                <button class="close-btn" onclick="window.plantBuddy.hideModal('quickWaterModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="quick-water-content">
                <p>Select plants to water (${plantsNeedingWater.length} need water):</p>
                <div class="quick-water-controls">
                    <button class="btn-secondary" onclick="window.plantBuddy.selectAllPlants()">
                        <i class="fas fa-check-square"></i>
                        Select All
                    </button>
                    <button class="btn-secondary" onclick="window.plantBuddy.deselectAllPlants()">
                        <i class="fas fa-square"></i>
                        Deselect All
                    </button>
                </div>
                <div class="plants-to-water-list">
                    ${plantsNeedingWater.map(plant => {
                        const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
                        const isUrgent = daysSinceWatered > plant.wateringFrequency;
                        return `
                            <div class="plant-water-item ${isUrgent ? 'urgent' : ''}">
                                <label class="plant-checkbox">
                                    <input type="checkbox" value="${plant.id}" checked>
                                    <span class="checkmark"></span>
                                    <div class="plant-info">
                                        <div class="plant-name">${plant.name}</div>
                                        <div class="plant-details">
                                            <span class="plant-type">${plant.type}</span>
                                            <span class="water-status ${isUrgent ? 'urgent' : 'normal'}">
                                                ${isUrgent ? 'Overdue' : 'Due'} (${daysSinceWatered} days)
                                            </span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="window.plantBuddy.hideModal('quickWaterModal')">
                    Cancel
                </button>
                <button class="btn-primary" onclick="window.plantBuddy.waterSelectedPlants()">
                    <i class="fas fa-tint"></i>
                    Water Selected Plants
                </button>
            </div>
        `;

        // Create modal if it doesn't exist
        let modal = document.getElementById('quickWaterModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quickWaterModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content">
                ${modalContent}
            </div>
        `;

        this.showModal('quickWaterModal');
    }

    selectAllPlants() {
        const checkboxes = document.querySelectorAll('#quickWaterModal input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    deselectAllPlants() {
        const checkboxes = document.querySelectorAll('#quickWaterModal input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    waterSelectedPlants() {
        const selectedCheckboxes = document.querySelectorAll('#quickWaterModal input[type="checkbox"]:checked');
        const selectedPlantIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (selectedPlantIds.length === 0) {
            this.showNotification('No plants selected for watering! 🌱', 'info');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        let wateredCount = 0;

        this.plants.forEach(plant => {
            if (selectedPlantIds.includes(plant.id)) {
                plant.lastWatered = today;
                wateredCount++;
            }
        });

        this.savePlants();
        this.renderPlants();
        this.updateStats();
        this.updateDashboard();
        this.hideModal('quickWaterModal');

        this.showNotification(`Successfully watered ${wateredCount} plant${wateredCount !== 1 ? 's' : ''}! 💧`, 'success');
    }

    waterAllPlants() {
        if (this.plants.length === 0) {
            this.showNotification('No plants to water! 🌱', 'info');
            return;
        }

        // Count plants that actually need water
        const plantsNeedingWater = this.plants.filter(plant => {
            const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
            return daysSinceWatered >= plant.wateringFrequency;
        });

        if (plantsNeedingWater.length === 0) {
            this.showNotification('All plants are already well watered! 💧', 'info');
            return;
        }

        const message = plantsNeedingWater.length === this.plants.length 
            ? `Water all ${this.plants.length} plants? This will mark all plants as watered today.`
            : `Water ${plantsNeedingWater.length} plants that need water? This will mark them as watered today.`;

        if (confirm(message)) {
            const today = new Date().toISOString().split('T')[0];
            let wateredCount = 0;
            
            this.plants.forEach(plant => {
                const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
                if (daysSinceWatered >= plant.wateringFrequency) {
                    plant.lastWatered = today;
                    wateredCount++;
                }
            });
            
            this.savePlants();
            this.renderPlants();
            this.updateStats();
            this.updateDashboard();
            
            if (wateredCount > 0) {
                this.showNotification(`Successfully watered ${wateredCount} plant${wateredCount !== 1 ? 's' : ''}! 💧`, 'success');
            } else {
                this.showNotification('All plants were already watered! 🌱', 'info');
            }
        }
    }

    exportData() {
        if (this.plants.length === 0) {
            this.showNotification('No plant data to export! 🌱', 'info');
            return;
        }

        const data = {
            plants: this.plants,
            exportDate: new Date().toISOString(),
            totalPlants: this.plants.length,
            stats: {
                needsWater: this.plants.filter(plant => {
                    const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
                    return daysSinceWatered >= plant.wateringFrequency;
                }).length,
                wateredToday: this.plants.filter(plant => {
                    return plant.lastWatered === new Date().toISOString().split('T')[0];
                }).length,
                healthyPlants: this.plants.filter(plant => {
                    const daysSinceWatered = this.getDaysSinceWatered(plant.lastWatered);
                    return daysSinceWatered < plant.wateringFrequency;
                }).length
            },
            exportInfo: {
                appVersion: '1.0.0',
                exportFormat: 'JSON',
                generatedBy: 'Plant Buddy App'
            }
        };

        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `plant-buddy-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification(`Plant data exported successfully! 📁 (${this.plants.length} plants)`, 'success');
        } catch (error) {
            this.showNotification('Failed to export data. Please try again.', 'error');
            console.error('Export error:', error);
        }
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    saveEditedPlant() {
        if (!this.currentPlantId) return;
        const plantIndex = this.plants.findIndex(p => p.id === this.currentPlantId);
        if (plantIndex === -1) return;
        const formData = new FormData(document.getElementById('editPlantForm'));
        const plantType = formData.get('editPlantType');
        const customPlantType = formData.get('editCustomPlantType');
        const lastWatered = formData.get('editLastWatered');
        
        // Validate that last watered date is not in the future
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        
        if (lastWatered > todayString) {
            this.showNotification('Last watered date cannot be in the future!', 'error');
            return;
        }
        
        this.plants[plantIndex] = {
            ...this.plants[plantIndex],
            name: formData.get('editPlantName'),
            type: plantType === 'other' ? customPlantType : plantType,
            description: formData.get('editPlantDescription'),
            wateringFrequency: parseInt(formData.get('editWateringFrequency')),
            lastWatered: lastWatered,
            notes: formData.get('editPlantNotes'),
        };
        this.savePlants();
        this.renderPlants();
        this.updateStats();
        this.updateDashboard();
        this.hideModal('editPlantModal');
        this.hideModal('plantDetailModal');
        this.showNotification('Plant updated successfully! 🌿', 'success');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.plantBuddy = new PlantBuddy();
}); 