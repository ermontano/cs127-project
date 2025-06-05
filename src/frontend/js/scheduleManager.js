/**
 * Schedule Manager - Handles course scheduling and calendar view
 */

class ScheduleManager {
    constructor() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.schedules = [];
        this.courses = [];
        this.courseColors = {};
        this.selectedCourseColor = '#3b82f6'; // Default blue color in RGB
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeCalendar();
        // Initialize color picker with default selection
        setTimeout(() => {
            this.setColorPickerSelection('#3b82f6');
        }, 100);
    }

    bindEvents() {
        // Week navigation (main navigation is handled by UI manager)
        document.getElementById('schedule-prev-week')?.addEventListener('click', () => {
            this.navigateWeek(-1);
        });

        document.getElementById('schedule-next-week')?.addEventListener('click', () => {
            this.navigateWeek(1);
        });

        document.getElementById('schedule-today')?.addEventListener('click', () => {
            this.goToToday();
        });

        // Course form schedule management
        document.getElementById('add-schedule-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.addScheduleItem();
        });

        // Color picker event listeners
        this.bindColorPickerEvents();
    }

    /**
     * Bind color picker events
     */
    bindColorPickerEvents() {
        // Handle color input changes - use arrow function to preserve 'this' context
        const handleColorInput = (e) => {
            if (e.target.id === 'course-color') {
                const newColor = e.target.value;
                this.selectedCourseColor = newColor;
                this.updateColorPreview(newColor);
                console.log('Color selected:', newColor, 'this.selectedCourseColor:', this.selectedCourseColor);
            }
        };

        document.addEventListener('input', handleColorInput);
    }

    /**
     * Update color preview elements
     */
    updateColorPreview(color) {
        const colorPreview = document.getElementById('color-preview');
        const colorValue = document.getElementById('color-value');
        
        if (colorPreview) {
            colorPreview.style.background = color;
        }
        if (colorValue) {
            colorValue.textContent = color.toUpperCase();
        }
    }

    /**
     * Get selected course color
     */
    getSelectedCourseColor() {
        return this.selectedCourseColor || '#3b82f6';
    }

    /**
     * Set course color for a specific course
     */
    setCourseColor(courseTitle, color) {
        this.courseColors[courseTitle] = color;
        // Update calendar display to reflect color change
        this.updateCalendarDisplay();
        this.updateScheduleLegend();
    }

    /**
     * Load schedules when the schedule view is shown
     */
    async loadScheduleView() {
        // Load and display schedules
        await this.loadSchedules();
        this.updateCalendarDisplay();
        this.updateScheduleLegend();
    }

    /**
     * Initialize the calendar structure
     */
    initializeCalendar() {
        this.generateTimeSlots();
        this.updateWeekDisplay();
    }

    /**
     * Generate time slots for the calendar (7 AM to 9 PM)
     */
    generateTimeSlots() {
        const timeColumn = document.querySelector('.calendar-grid .calendar-time-column');
        if (!timeColumn) return;

        timeColumn.innerHTML = '';
        
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            
            const timeString = hour === 0 ? '12 AM' :
                             hour === 12 ? '12 PM' :
                             hour > 12 ? `${hour - 12} PM` : 
                             `${hour} AM`;
            
            timeSlot.textContent = timeString;
            timeColumn.appendChild(timeSlot);
        }
    }

    /**
     * Get the start of the week (Sunday) for a given date
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    /**
     * Navigate to previous or next week
     */
    navigateWeek(direction) {
        const newDate = new Date(this.currentWeekStart);
        newDate.setDate(newDate.getDate() + (direction * 7));
        this.currentWeekStart = newDate;
        this.updateWeekDisplay();
        this.updateCalendarDisplay();
    }

    /**
     * Go to current week
     */
    goToToday() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.updateWeekDisplay();
        this.updateCalendarDisplay();
    }

    /**
     * Update week display text and day numbers
     */
    updateWeekDisplay() {
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekDisplay = document.getElementById('schedule-week-display');
        if (weekDisplay) {
            const startStr = this.currentWeekStart.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: this.currentWeekStart.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });
            const endStr = weekEnd.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: weekEnd.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });
            weekDisplay.textContent = `${startStr} - ${endStr}`;
        }

        // Update day numbers and today highlighting
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(this.currentWeekStart);
            dayDate.setDate(dayDate.getDate() + i);
            
            const dayElement = document.getElementById(`day-${i}`);
            if (dayElement) {
                dayElement.textContent = dayDate.getDate();
            }

            // Add today class
            const calendarDay = document.querySelector(`.calendar-day[data-day="${i}"]`);
            const dayColumn = document.querySelector(`.calendar-day-column[data-day="${i}"]`);
            
            if (dayDate.getTime() === today.getTime()) {
                calendarDay?.classList.add('today');
                dayColumn?.classList.add('today');
            } else {
                calendarDay?.classList.remove('today');
                dayColumn?.classList.remove('today');
            }
        }
    }

    /**
     * Load schedules from the server
     */
    async loadSchedules() {
        try {
            console.log('Loading schedules...');
            const response = await fetch('/api/schedules');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Schedules result:', result);
            
            if (result.success) {
                this.schedules = result.data || [];
                
                // Load course colors from database
                await this.loadCourseColors();
                
                // Assign default colors for any courses that don't have saved colors
                this.assignCourseColors();
                
                console.log('Loaded schedules:', this.schedules);
                console.log('Loaded course colors:', this.courseColors);
            } else {
                console.error('Server returned error:', result.message);
                if (window.uiManager) {
                    window.uiManager.showPageAlert(result.message || 'Failed to load course schedules', 'error');
                }
            }
        } catch (error) {
            console.error('Error loading schedules:', error);
            if (window.uiManager) {
                window.uiManager.showPageAlert('Failed to load course schedules', 'error');
            }
        }
    }

    /**
     * Load course colors from database
     */
    async loadCourseColors() {
        try {
            // Get unique courses by ID to avoid duplicates
            const uniqueCourseMap = new Map();
            this.schedules.forEach(s => {
                if (s.course_id && s.course_title) {
                    uniqueCourseMap.set(s.course_id, s.course_title);
                }
            });
            
            // Fetch color for each unique course
            for (const [courseId, courseTitle] of uniqueCourseMap) {
                try {
                    const response = await fetch(`/api/courses/${courseId}`);
                    const result = await response.json();
                    
                    if (result.success && result.data && result.data.color) {
                        this.courseColors[courseTitle] = result.data.color;
                        console.log(`Loaded color for ${courseTitle}: ${result.data.color}`);
                    }
                } catch (error) {
                    console.warn(`Failed to load color for course ${courseTitle}:`, error);
                }
            }
        } catch (error) {
            console.error('Error loading course colors:', error);
        }
    }

    /**
     * Assign colors to courses for visual distinction
     */
    assignCourseColors() {
        const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
        const uniqueCourses = [...new Set(this.schedules.map(s => s.course_title))];
        
        uniqueCourses.forEach((course, index) => {
            if (!this.courseColors[course]) {
                this.courseColors[course] = colors[index % colors.length];
            }
        });
    }

    /**
     * Update the schedule legend
     */
    updateScheduleLegend() {
        const legendContainer = document.getElementById('legend-items');
        if (!legendContainer) return;

        legendContainer.innerHTML = '';

        const uniqueCourses = [...new Set(this.schedules.map(s => s.course_title))];
        
        uniqueCourses.forEach(course => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = this.courseColors[course] || '#3b82f6';
            
            const courseName = document.createElement('span');
            courseName.textContent = course;
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(courseName);
            
            // Add click event to change course color
            legendItem.addEventListener('click', () => {
                this.showColorPickerModal(course);
            });
            
            legendContainer.appendChild(legendItem);
        });

        // Show/hide legend based on whether there are courses
        const legend = document.getElementById('schedule-legend');
        if (legend) {
            legend.style.display = uniqueCourses.length > 0 ? 'block' : 'none';
        }
    }

    /**
     * Show color picker modal for course
     */
    showColorPickerModal(courseTitle) {
        const colors = ['blue', 'green', 'purple', 'orange', 'red', 'pink', 'indigo', 'teal'];
        const currentColor = this.courseColors[courseTitle];

        // Create a simple color selection dialog
        const colorButtons = colors.map(color => 
            `<button class="color-option ${color} ${currentColor === color ? 'selected' : ''}" 
                     data-color="${color}" 
                     style="margin: 0.25rem; width: 2rem; height: 2rem; border-radius: 50%; border: 2px solid ${currentColor === color ? '#333' : 'transparent'};">
             </button>`
        ).join('');

        if (window.uiManager && window.uiManager.showConfirmDialog) {
            window.uiManager.showConfirmDialog(
                `Change color for ${courseTitle}`,
                `<div style="text-align: center; padding: 1rem;">
                    <p>Select a new color for this course:</p>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
                        ${colorButtons}
                    </div>
                </div>`,
                'Update Color',
                () => {
                    const selectedOption = document.querySelector('.color-option.selected');
                    if (selectedOption) {
                        const newColor = selectedOption.dataset.color;
                        this.setCourseColor(courseTitle, newColor);
                    }
                }
            );
            
            // Add event listeners for color selection in modal
            setTimeout(() => {
                document.querySelectorAll('#confirm-modal .color-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        document.querySelectorAll('#confirm-modal .color-option').forEach(opt => {
                            opt.classList.remove('selected');
                            opt.style.border = '2px solid transparent';
                        });
                        e.target.classList.add('selected');
                        e.target.style.border = '2px solid #333';
                    });
                });
            }, 100);
        }
    }

    /**
     * Update calendar display with events
     */
    updateCalendarDisplay() {
        console.log('Updating calendar display with schedules:', this.schedules);
        
        // Clear existing events
        document.querySelectorAll('.calendar-event').forEach(event => {
            event.remove();
        });

        // Group schedules by day to detect overlaps
        const schedulesByDay = {};
        this.schedules.forEach(schedule => {
            const day = schedule.day_of_week;
            if (!schedulesByDay[day]) {
                schedulesByDay[day] = [];
            }
            schedulesByDay[day].push(schedule);
        });

        // Process each day and handle overlaps
        Object.keys(schedulesByDay).forEach(day => {
            const daySchedules = schedulesByDay[day];
            const positionedSchedules = this.calculateOverlapPositions(daySchedules);
            
            positionedSchedules.forEach(schedule => {
                console.log('Creating calendar event for schedule:', schedule);
                this.createCalendarEvent(schedule);
            });
        });
        
        console.log('Calendar events created. Total events on calendar:', document.querySelectorAll('.calendar-event').length);
    }

    /**
     * Calculate overlap positions for schedules on the same day
     */
    calculateOverlapPositions(daySchedules) {
        // Convert time strings to minutes for easier comparison
        const convertTimeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Add time info in minutes to each schedule
        const schedulesWithTime = daySchedules.map(schedule => ({
            ...schedule,
            startMinutes: convertTimeToMinutes(schedule.start_time),
            endMinutes: convertTimeToMinutes(schedule.end_time),
            overlapInfo: { width: 100, left: 0, column: 0 }
        }));

        // Sort by start time
        schedulesWithTime.sort((a, b) => a.startMinutes - b.startMinutes);

        // Find overlapping groups
        const overlapGroups = [];
        
        for (let i = 0; i < schedulesWithTime.length; i++) {
            const currentSchedule = schedulesWithTime[i];
            let foundGroup = false;

            // Check if this schedule overlaps with any existing group
            for (let group of overlapGroups) {
                const overlapsWithGroup = group.some(groupSchedule => 
                    currentSchedule.startMinutes < groupSchedule.endMinutes && 
                    currentSchedule.endMinutes > groupSchedule.startMinutes
                );

                if (overlapsWithGroup) {
                    group.push(currentSchedule);
                    foundGroup = true;
                    break;
                }
            }

            // If no overlap found, create new group
            if (!foundGroup) {
                overlapGroups.push([currentSchedule]);
            }
        }

        // Calculate positioning for each group
        overlapGroups.forEach(group => {
            const groupSize = group.length;
            if (groupSize > 1) {
                // Multiple events overlap - arrange side by side
                // For better readability, limit to maximum 3 columns
                const maxColumns = Math.min(groupSize, 3);
                const columnWidth = 100 / maxColumns;
                
                group.forEach((schedule, index) => {
                    const columnIndex = index % maxColumns;
                    schedule.overlapInfo.width = columnWidth - 0.5; // Small gap between columns
                    schedule.overlapInfo.left = columnWidth * columnIndex;
                    schedule.overlapInfo.column = columnIndex;
                    
                    // If more than 3 events, stack them by adjusting z-index and slight offset
                    if (index >= maxColumns) {
                        schedule.overlapInfo.zOffset = Math.floor(index / maxColumns);
                    }
                });
            }
            // Single events keep default 100% width, 0% left
        });

        return schedulesWithTime;
    }

    /**
     * Create a calendar event element
     */
    createCalendarEvent(schedule) {
        const dayColumn = document.querySelector(`.calendar-day-column[data-day="${schedule.day_of_week}"]`);
        if (!dayColumn) {
            console.error('Day column not found for day:', schedule.day_of_week);
            return;
        }

        const event = document.createElement('div');
        event.className = 'calendar-event';
        event.style.backgroundColor = this.courseColors[schedule.course_title] || '#3b82f6';
        event.setAttribute('data-course-id', schedule.course_id);
        event.setAttribute('data-course-title', schedule.course_title);
        
        const eventTitle = document.createElement('div');
        eventTitle.className = 'event-title';
        eventTitle.textContent = schedule.course_title;
        
        const eventTime = document.createElement('div');
        eventTime.className = 'event-time';
        eventTime.textContent = `${this.formatTime(schedule.start_time)} - ${this.formatTime(schedule.end_time)}`;
        
        event.appendChild(eventTitle);
        event.appendChild(eventTime);
        
        // Add click handler to access course topics
        event.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openCourseTopics(schedule.course_id, schedule.course_title);
        });
        
        // Calculate position based on time
        const position = this.calculateEventPosition(schedule.start_time, schedule.end_time);
        console.log(`Setting event position for ${schedule.course_title}: top=${position.top}px, height=${position.height}px`);
        event.style.top = `${position.top}px`;
        event.style.height = `${position.height}px`;

        // Apply overlap positioning if available
        if (schedule.overlapInfo) {
            event.style.width = `${schedule.overlapInfo.width}%`;
            event.style.left = `${schedule.overlapInfo.left}%`;
            event.style.position = 'absolute';
            
            // Add z-index to ensure proper layering
            let zIndex = 10 + schedule.overlapInfo.column;
            if (schedule.overlapInfo.zOffset) {
                zIndex += schedule.overlapInfo.zOffset * 10;
                // Add slight visual offset for stacked events
                event.style.transform = `translateY(${schedule.overlapInfo.zOffset * 2}px)`;
                event.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2)';
            }
            event.style.zIndex = zIndex;
            
            console.log(`Overlap positioning for ${schedule.course_title}: width=${schedule.overlapInfo.width}%, left=${schedule.overlapInfo.left}%`);
        }
        
        dayColumn.appendChild(event);
        console.log('Event added to day column:', schedule.day_of_week, 'Event element:', event);
    }

    /**
     * Calculate event position and height based on time
     */
    calculateEventPosition(startTime, endTime) {
        const timeSlotHeight = 60; // Height of each hour slot
        const startHour = 0; // Calendar starts at 12 AM (midnight)
        
        const [startHourNum, startMinute] = startTime.split(':').map(Number);
        const [endHourNum, endMinute] = endTime.split(':').map(Number);
        
        const startOffset = (startHourNum - startHour) + (startMinute / 60);
        const duration = (endHourNum - startHourNum) + ((endMinute - startMinute) / 60);
        
        return {
            top: startOffset * timeSlotHeight,
            height: duration * timeSlotHeight
        };
    }

    /**
     * Format time from 24-hour to 12-hour format
     */
    formatTime(timeString) {
        const [hour, minute] = timeString.split(':').map(Number);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    }

    /**
     * Open course when calendar event is clicked
     */
    openCourseTopics(courseId, courseTitle) {
        if (window.uiManager && window.coursesManager) {
            // Navigate directly to the course view
            if (window.coursesManager.selectCourse) {
                window.coursesManager.selectCourse(courseId);
            } else {
                // Fallback to showing the course view directly
                window.uiManager.showCourseView(courseId);
            }
        }
    }

    /**
     * Add a new schedule item to the course form - Improved UI
     */
    addScheduleItem(scheduleData = null) {
        const container = document.getElementById('course-schedules-container');
        if (!container) return;

        // Show color picker when first schedule is added
        this.showColorPickerIfFirstSchedule();

        const scheduleItem = document.createElement('div');
        scheduleItem.className = 'schedule-item';
        
        // Helper to format time to HH:MM
        const formatTimeToHHMM = (timeString) => {
            if (timeString && typeof timeString === 'string' && timeString.includes(':')) {
                const parts = timeString.split(':');
                return `${parts[0]}:${parts[1]}`;
            }
            return timeString || ''; // Return original or empty string if not formattable
        };

        const initialStartTime = formatTimeToHHMM(scheduleData?.start_time);
        const initialEndTime = formatTimeToHHMM(scheduleData?.end_time);

        scheduleItem.innerHTML = `
            <div class="schedule-days-selection">
                <label>Days:</label>
                <div class="days-checkboxes">
                    <label><input type="checkbox" value="1" ${scheduleData?.day_of_week === 1 ? 'checked' : ''}>Mon</label>
                    <label><input type="checkbox" value="2" ${scheduleData?.day_of_week === 2 ? 'checked' : ''}>Tue</label>
                    <label><input type="checkbox" value="3" ${scheduleData?.day_of_week === 3 ? 'checked' : ''}>Wed</label>
                    <label><input type="checkbox" value="4" ${scheduleData?.day_of_week === 4 ? 'checked' : ''}>Thu</label>
                    <label><input type="checkbox" value="5" ${scheduleData?.day_of_week === 5 ? 'checked' : ''}>Fri</label>
                    <label><input type="checkbox" value="6" ${scheduleData?.day_of_week === 6 ? 'checked' : ''}>Sat</label>
                    <label><input type="checkbox" value="0" ${scheduleData?.day_of_week === 0 ? 'checked' : ''}>Sun</label>
                </div>
            </div>
            <div class="schedule-time-selection">
                <label>Time:</label>
                <div class="time-inputs">
                    <input type="time" class="schedule-start-time" value="${initialStartTime}" required>
                    <span>to</span>
                    <input type="time" class="schedule-end-time" value="${initialEndTime}" required>
                </div>
            </div>
            <button type="button" class="remove-schedule-btn" title="Remove Schedule">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add remove functionality
        scheduleItem.querySelector('.remove-schedule-btn').addEventListener('click', () => {
            scheduleItem.remove();
            // Hide color picker if no schedules remain
            this.hideColorPickerIfNoSchedules();
        });

        container.appendChild(scheduleItem);
    }

    /**
     * Show color picker when first schedule is added
     */
    showColorPickerIfFirstSchedule() {
        const container = document.getElementById('course-schedules-container');
        if (!container) return;

        const existingSchedules = container.querySelectorAll('.schedule-item');
        if (existingSchedules.length === 0) {
            // This will be the first schedule, show entire color picker section
            const colorPickerSection = document.querySelector('.course-color-picker');
            
            if (colorPickerSection) {
                colorPickerSection.style.display = 'block';
                
                // Only set default color if we're adding a new course (not editing)
                const courseForm = document.getElementById('course-form');
                const isEditing = courseForm && courseForm.dataset.editingId;
                
                if (!isEditing) {
                    // For new courses, ensure we have a proper default color
                    this.setColorPickerSelection('#3b82f6');
                }
                // For editing courses, the color will be set by loadCourseSchedules
            }
        }
    }

    /**
     * Hide color picker if no schedules remain
     */
    hideColorPickerIfNoSchedules() {
        const container = document.getElementById('course-schedules-container');
        if (!container) return;

        const remainingSchedules = container.querySelectorAll('.schedule-item');
        if (remainingSchedules.length === 0) {
            // No schedules left, hide entire color picker section
            const colorPickerSection = document.querySelector('.course-color-picker');
            
            if (colorPickerSection) {
                colorPickerSection.style.display = 'none';
            }
        }
    }

    /**
     * Get schedule data from the course form
     */
    getScheduleDataFromForm() {
        const scheduleItems = document.querySelectorAll('.schedule-item');
        const schedules = [];

        scheduleItems.forEach(item => {
            const checkedDays = item.querySelectorAll('.days-checkboxes input[type="checkbox"]:checked');
            const startTime = item.querySelector('.schedule-start-time').value;
            const endTime = item.querySelector('.schedule-end-time').value;

            if (checkedDays.length > 0 && startTime && endTime) {
                checkedDays.forEach(dayCheckbox => {
                    schedules.push({
                        day_of_week: parseInt(dayCheckbox.value),
                        start_time: startTime,
                        end_time: endTime
                    });
                });
            }
        });

        return schedules;
    }

    /**
     * Clear all schedule items from the course form
     */
    clearScheduleForm() {
        const container = document.getElementById('course-schedules-container');
        if (container) {
            container.innerHTML = '';
            // Hide color picker when schedules are cleared
            this.hideColorPickerIfNoSchedules();
        }
    }

    /**
     * Load schedules for a specific course into the form
     */
    async loadCourseSchedules(courseId) {
        if (!courseId) return;

        try {
            const response = await fetch(`/api/schedules/course/${courseId}`);
            const result = await response.json();
            
            console.log('Loading course schedules for course:', courseId, result);
            
            if (result.success && result.data && result.data.length > 0) {
                this.clearScheduleForm();
                
                // Show color picker section before adding schedules
                const colorPickerSection = document.querySelector('.course-color-picker');
                if (colorPickerSection) {
                    colorPickerSection.style.display = 'block';
                }
                
                result.data.forEach(schedule => {
                    this.addScheduleItem(schedule);
                });
                
                // Set the course color picker to match existing color
                const firstSchedule = result.data[0];
                
                // First try to get color from course data (if passed from edit modal)
                // Then try courseColors cache, finally default to blue
                let colorToSet = '#3b82f6'; // default
                
                // Try to get the course color from the database
                try {
                    const courseResponse = await fetch(`/api/courses/${courseId}`);
                    const courseResult = await courseResponse.json();
                    
                    if (courseResult.success && courseResult.data && courseResult.data.color) {
                        colorToSet = courseResult.data.color;
                        // Update our courseColors cache too
                        this.courseColors[firstSchedule.course_title] = colorToSet;
                    } else if (firstSchedule.course_title && this.courseColors[firstSchedule.course_title]) {
                        colorToSet = this.courseColors[firstSchedule.course_title];
                    }
                } catch (error) {
                    console.warn('Could not fetch course color, using cache or default');
                    if (firstSchedule.course_title && this.courseColors[firstSchedule.course_title]) {
                        colorToSet = this.courseColors[firstSchedule.course_title];
                    }
                }
                
                this.setColorPickerSelection(colorToSet);
            } else {
                // No schedules found, just clear form and set default color - direct call
                this.clearScheduleForm();
                this.setColorPickerSelection('#3b82f6');
                console.log('No schedules found for course:', courseId);
            }
        } catch (error) {
            console.error('Error loading course schedules:', error);
            // On error, clear form and set default color - direct call
            this.clearScheduleForm();
            this.setColorPickerSelection('#3b82f6');
        }
    }

    /**
     * Set color picker selection
     */
    setColorPickerSelection(colorValue) {
        const courseModal = document.getElementById('course-modal');
        if (!courseModal) {
            console.warn('setColorPickerSelection: Course modal not found. Cannot set color', colorValue);
            return; 
        }
        
        console.log(`setColorPickerSelection: Attempting to set color to "${colorValue}" in #course-modal.`);

        const colorInput = courseModal.querySelector('#course-color');
        if (colorInput) {
            colorInput.value = colorValue;
            this.selectedCourseColor = colorValue;
            this.updateColorPreview(colorValue);
            console.log(`setColorPickerSelection: Successfully set to "${colorValue}". Current this.selectedCourseColor: ${this.selectedCourseColor}`);
        } else {
            console.warn('setColorPickerSelection: Color input not found in #course-modal. Defaulting to blue.');
            this.selectedCourseColor = '#3b82f6';
        }
    }

    /**
     * Save schedules for a course
     */
    async saveSchedules(courseId, schedules) {
        try {
            console.log('Saving schedules for course:', courseId, schedules);
            
            // First, delete existing schedules for this course
            const deleteResponse = await fetch(`/api/schedules/course/${courseId}`, {
                method: 'DELETE'
            });
            console.log('Delete response status:', deleteResponse.status);

            // Then create new schedules
            for (const schedule of schedules) {
                console.log('Creating schedule:', schedule);
                const createResponse = await fetch('/api/schedules', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        course_id: courseId,
                        ...schedule
                    })
                });
                
                console.log('Create response status:', createResponse.status);
                
                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    console.error('Error creating schedule:', errorText);
                    throw new Error(`Failed to create schedule: ${createResponse.status}`);
                }
            }

            return true;
        } catch (error) {
            console.error('Error saving schedules:', error);
            return false;
        }
    }
}

// Initialize the schedule manager
const scheduleManager = new ScheduleManager();

// Export for use in other modules
window.scheduleManager = scheduleManager; 