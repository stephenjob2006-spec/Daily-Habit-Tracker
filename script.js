// Global variables
let habits = [];
let currentWeekStart = getStartOfWeek(new Date());

// Initialize app on page load
$(document).ready(function() {
    loadHabitsFromStorage();
    renderHabits();
    updateStats();
    
    // Add enter key support for habit input
    $('#habitNameInput').on('keypress', function(e) {
        if (e.which === 13) {
            addHabit();
        }
    });
});

// Utility Functions
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function getDateString(date) {
    return date.toISOString().split('T')[0];
}

// Habit Management Functions
function addHabit() {
    const habitName = $('#habitNameInput').val().trim();
    if (!habitName) {
        alert('Please enter a habit name!');
        return;
    }
    
    const newHabit = {
        id: Date.now(),
        name: habitName,
        completedDates: {},
        createdAt: new Date().toISOString()
    };
    
    habits.push(newHabit);
    $('#habitNameInput').val('');
    saveHabitsToStorage();
    renderHabits();
    updateStats();
}

function deleteHabit(habitId) {
    if (confirm('Are you sure you want to delete this habit?')) {
        habits = habits.filter(h => h.id !== habitId);
        saveHabitsToStorage();
        renderHabits();
        updateStats();
    }
}

function editHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    const newName = prompt('Enter new habit name:', habit.name);
    if (newName && newName.trim()) {
        habit.name = newName.trim();
        saveHabitsToStorage();
        renderHabits();
    }
}

function toggleHabitDay(habitId, dateString) {
    const habit = habits.find(h => h.id === habitId);
    if (habit.completedDates[dateString]) {
        delete habit.completedDates[dateString];
    } else {
        habit.completedDates[dateString] = true;
    }
    saveHabitsToStorage();
    renderHabits();
    updateStats();
}

// Streak Calculation Functions
function getCurrentStreak(habit) {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = getDateString(date);
        
        if (habit.completedDates[dateString]) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

function getBestStreak(habit) {
    const dates = Object.keys(habit.completedDates).sort();
    if (dates.length === 0) return 0;
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currentDate = new Date(dates[i]);
        const diffTime = currentDate - prevDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }
    
    return maxStreak;
}

function getWeeklyCompletionRate(habit) {
    let completed = 0;
    let total = 7;
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        const dateString = getDateString(date);
        
        if (habit.completedDates[dateString]) {
            completed++;
        }
    }
    
    return Math.round((completed / total) * 100);
}

// Rendering Functions
function renderHabits() {
    const container = $('#habitsContainer');
    container.empty();
    
    if (habits.length === 0) {
        container.html(`
            <div class="text-center p-5">
                <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                <h4 class="text-muted">No habits yet!</h4>
                <p class="text-muted">Add your first habit above to start tracking your progress.</p>
            </div>
        `);
        return;
    }
    
    habits.forEach(habit => {
        const habitHtml = createHabitHtml(habit);
        container.append(habitHtml);
    });
}

function createHabitHtml(habit) {
    const currentStreak = getCurrentStreak(habit);
    const bestStreak = getBestStreak(habit);
    const weeklyRate = getWeeklyCompletionRate(habit);
    
    let daysHtml = '';
    const today = new Date();
    
    // Create grid for current week (7 days)
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        const dateString = getDateString(date);
        const isCompleted = habit.completedDates[dateString];
        const isToday = getDateString(date) === getDateString(today);
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const dayNumber = date.getDate();
        
        daysHtml += `
            <div class="day-cell ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}" 
                 onclick="toggleHabitDay(${habit.id}, '${dateString}')">
                <div>${dayName}</div>
                <div>${dayNumber}</div>
                ${isCompleted ? '<i class="fas fa-check"></i>' : ''}
            </div>
        `;
    }
    
    return `
        <div class="habit-item">
            <div class="habit-header">
                <div class="habit-name">${habit.name}</div>
                <div class="habit-controls">
                    <button class="btn btn-sm btn-secondary-custom" onclick="editHabit(${habit.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger-custom" onclick="deleteHabit(${habit.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="day-grid">
                ${daysHtml}
            </div>
            <div class="progress-bar-custom">
                <div class="progress-fill" style="width: ${weeklyRate}%"></div>
            </div>
            <div class="streak-info">
                <div>
                    <span class="streak-badge">🔥 Current: ${currentStreak}</span>
                    <span class="streak-badge ms-2">🏆 Best: ${bestStreak}</span>
                </div>
                <div>
                    <small class="text-muted">Weekly Progress: ${weeklyRate}%</small>
                </div>
            </div>
        </div>
    `;
}

// Statistics Functions
function updateStats() {
    const totalHabits = habits.length;
    let completedToday = 0;
    let longestStreak = 0;
    let weeklyCompletions = 0;
    let weeklyTotal = 0;
    
    const todayString = getDateString(new Date());
    
    habits.forEach(habit => {
        if (habit.completedDates[todayString]) {
            completedToday++;
        }
        
        const currentStreak = getCurrentStreak(habit);
        const bestStreak = getBestStreak(habit);
        longestStreak = Math.max(longestStreak, Math.max(currentStreak, bestStreak));
        
        // Calculate weekly completions
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            const dateString = getDateString(date);
            
            if (habit.completedDates[dateString]) {
                weeklyCompletions++;
            }
            weeklyTotal++;
        }
    });
    
    const weeklyRate = weeklyTotal > 0 ? Math.round((weeklyCompletions / weeklyTotal) * 100) : 0;
    
    $('#totalHabits').text(totalHabits);
    $('#completedToday').text(completedToday);
    $('#longestStreak').text(longestStreak);
    $('#completionRate').text(weeklyRate + '%');
}

// Data Management Functions
function clearAllData() {
    if (confirm('Are you sure you want to delete all habits and data? This cannot be undone!')) {
        habits = [];
        saveHabitsToStorage();
        renderHabits();
        updateStats();
    }
}

function resetThisWeek() {
    if (confirm('Are you sure you want to reset this week\'s progress for all habits?')) {
        habits.forEach(habit => {
            for (let i = 0; i < 7; i++) {
                const date = new Date(currentWeekStart);
                date.setDate(currentWeekStart.getDate() + i);
                const dateString = getDateString(date);
                delete habit.completedDates[dateString];
            }
        });
        saveHabitsToStorage();
        renderHabits();
        updateStats();
    }
}

// Local Storage Functions
function saveHabitsToStorage() {
    try {
        // For production use: uncomment the next line
        // localStorage.setItem('habitTrackerData', JSON.stringify(habits));
        console.log('Data saved successfully');
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

function loadHabitsFromStorage() {
    try {
        // For production use: uncomment the next lines
        // const saved = localStorage.getItem('habitTrackerData');
        // if (saved) {
        //     habits = JSON.parse(saved);
        //     return;
        // }
        
        // Demo data for testing (remove in production)
        if (habits.length === 0) {
            habits = [
                {
                    id: 1,
                    name: 'Exercise',
                    completedDates: {
                        [getDateString(new Date())]: true
                    },
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Read',
                    completedDates: {},
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Drink Water',
                    completedDates: {
                        [getDateString(new Date())]: true
                    },
                    createdAt: new Date().toISOString()
                }
            ];
        }
    } catch (error) {
        console.warn('Could not load from localStorage:', error);
        habits = [];
    }
}

// Additional Utility Functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

function getWeekRange() {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    
    return {
        start: formatDate(currentWeekStart),
        end: formatDate(endDate)
    };
}

// Export functions for potential future use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addHabit,
        deleteHabit,
        editHabit,
        toggleHabitDay,
        getCurrentStreak,
        getBestStreak,
        getWeeklyCompletionRate
    };
}
