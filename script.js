let weightChart;
let isKg = true;
let activityList = [];
let foodList = [];
let dailyCalorieTarget = 0;
let dailyCalorieDeficit = 0;

// Initialize sliders and inputs
const weeklyDeficitSlider = document.getElementById('weeklyDeficitSlider');
const weeklyDeficitInput = document.getElementById('weeklyDeficit');
const proteinSlider = document.getElementById('proteinSlider');
const proteinInput = document.getElementById('proteinIntake');

// Link sliders and inputs
weeklyDeficitSlider.addEventListener('input', function() {
    weeklyDeficitInput.value = this.value;
});

weeklyDeficitInput.addEventListener('input', function() {
    if (this.value < 0.1) this.value = 0.1;
    if (this.value > 2) this.value = 2;
    weeklyDeficitSlider.value = this.value;
});

proteinSlider.addEventListener('input', function() {
    proteinInput.value = this.value;
    if (document.getElementById('resultsSection').classList.contains('block')) {
        calculateMacros();
    }
});

proteinInput.addEventListener('input', function() {
    if (this.value < 1.2) this.value = 1.2;
    if (this.value > 2.2) this.value = 2.2;
    proteinSlider.value = this.value;
    if (document.getElementById('resultsSection').classList.contains('block')) {
        calculateMacros();
    }
});

// Activity input event listeners
document.getElementById('activityInput').addEventListener('input', function() {
    const input = this.value;
    const metMatch = input.match(/\(MET:\s*(\d+\.?\d*)\)/i);
    
    if (metMatch && metMatch[1]) {
        document.getElementById('metValue').value = metMatch[1];
    }
    
    calculateActivityCalories();
});

document.getElementById('metValue').addEventListener('input', calculateActivityCalories);
document.getElementById('activityDuration').addEventListener('input', calculateActivityCalories);

// Food input event listeners
document.getElementById('foodInput').addEventListener('input', function() {
    const input = this.value;
    const calorieMatch = input.match(/\((Carb|Fat|Protein):\s*(\d+)\s*cal\)/i);
    
    if (calorieMatch && calorieMatch[1] && calorieMatch[2]) {
        const type = calorieMatch[1].toLowerCase();
        const calories = parseInt(calorieMatch[2]);
        
        document.getElementById('foodType').value = type === 'carb' ? 'carb' : 
                                                   type === 'fat' ? 'fat' : 'protein';
        document.getElementById('foodCaloriesPerUnit').value = calories;
    }
    
    calculateFoodCalories();
});

document.getElementById('foodType').addEventListener('change', calculateFoodCalories);
document.getElementById('foodCaloriesPerUnit').addEventListener('input', calculateFoodCalories);
document.getElementById('foodPortions').addEventListener('input', calculateFoodCalories);

function updateWeightUnit() {
    isKg = !document.getElementById('weightToggle').checked;
    document.getElementById('weightUnitLabel').textContent = isKg ? 'kg' : 'lbs';
    document.getElementById('weeklyDeficitUnit').textContent = isKg ? 'kg/week' : 'lbs/week';
    
    // Update placeholder and values if they exist
    const currentWeight = document.getElementById('currentWeight');
    const desiredWeight = document.getElementById('desiredWeight');
    const weeklyDeficit = document.getElementById('weeklyDeficit');
    
    if (currentWeight.value) {
        currentWeight.value = isKg ? 
            (parseFloat(currentWeight.value) / 2.20462).toFixed(1) : 
            (parseFloat(currentWeight.value) * 2.20462).toFixed(1);
    }
    
    if (desiredWeight.value) {
        desiredWeight.value = isKg ? 
            (parseFloat(desiredWeight.value) / 2.20462).toFixed(1) : 
            (parseFloat(desiredWeight.value) * 2.20462).toFixed(1);
    }
    
    if (weeklyDeficit.value) {
        weeklyDeficit.value = isKg ? 
            (parseFloat(weeklyDeficit.value) / 2.20462).toFixed(1) : 
            (parseFloat(weeklyDeficit.value) * 2.20462).toFixed(1);
    }
}
function calculateAll() {
    // Get all input values
    const currentWeight = parseFloat(document.getElementById('currentWeight').value);
    const desiredWeight = parseFloat(document.getElementById('desiredWeight').value);
    const sex = document.querySelector('input[name="sex"]:checked').value;
    const height = parseFloat(document.getElementById('height').value);
    const age = parseFloat(document.getElementById('age').value);
    const bodyFat = document.getElementById('bodyFat').value ? parseFloat(document.getElementById('bodyFat').value) : null;
    const activityFactor = parseFloat(document.getElementById('activityFactor').value);
    const weeklyDeficit = parseFloat(document.getElementById('weeklyDeficit').value);
    
    // Validate inputs
    if (!currentWeight || !desiredWeight || !height || !age || !activityFactor) {
        alert("Please fill in all required fields.");
        return;
    }
    
    // Convert weights to kg for calculations if needed
    const currentWeightKg = isKg ? currentWeight : currentWeight / 2.20462;
    const desiredWeightKg = isKg ? desiredWeight : desiredWeight / 2.20462;
    const weeklyDeficitKg = isKg ? weeklyDeficit : weeklyDeficit / 2.20462;
    
    // Calculate BMR
    let bmr;
    if (bodyFat !== null) {
        // Using body fat percentage formula
        const leanBodyMass = currentWeightKg - (currentWeightKg * (bodyFat / 100));
        bmr = 370 + (21.6 * leanBodyMass);
    } else {
        // Using Mifflin-St Jeor formula
        if (sex === 'male') {
            bmr = (9.99 * currentWeightKg) + (6.25 * height) - (4.92 * age) + 5;
        } else {
            bmr = (9.99 * currentWeightKg) + (6.25 * height) - (4.92 * age) - 161;
        }
    }
    
    // Calculate TDEE
    const tdee = bmr * activityFactor;
    
    // Calculate weight difference and calorie deficit
    const weightDiffKg = currentWeightKg - desiredWeightKg;
    const weightDiffLbs = weightDiffKg * 2.20462;
    
    // Total calorie deficit needed
    const totalCalorieDeficit = weightDiffLbs * 3500;
    
    // Weekly and daily calorie deficit
    const weeklyCalorieDeficit = weeklyDeficitKg * 2.20462 * 3500;
    const dailyCalorieDeficit = weeklyCalorieDeficit / 7;
    
    // Store daily calorie deficit for later use
    this.dailyCalorieDeficit = Math.abs(dailyCalorieDeficit);
    
    // Days to reach goal
    const daysToGoal = Math.abs(Math.round(totalCalorieDeficit / dailyCalorieDeficit));
    
    // Daily calorie intake
    const dailyCalorieIntake = tdee - (weightDiffKg > 0 ? dailyCalorieDeficit : -dailyCalorieDeficit);
    
    // Store daily calorie target for later use
    this.dailyCalorieTarget = Math.round(dailyCalorieIntake);
    
    // Calculate BMI
    const heightInMeters = height / 100;
    const bmi = currentWeightKg / (heightInMeters * heightInMeters);
    
    // Calculate PI (Ponderation Index)
    const pi = currentWeightKg / Math.pow(heightInMeters, 3);
    
    // Update BMI marker position and category
    let bmiPosition;
    let bmiCategory;
    if (bmi < 18.5) {
        bmiPosition = (bmi / 18.5) * 25;
        bmiCategory = "Underweight";
    } else if (bmi < 25) {
        bmiPosition = 25 + ((bmi - 18.5) / 6.5) * 25;
        bmiCategory = "Normal";
    } else if (bmi < 30) {
        bmiPosition = 50 + ((bmi - 25) / 5) * 25;
        bmiCategory = "Overweight";
    } else {
        bmiPosition = 75 + Math.min(((bmi - 30) / 10) * 25, 25);
        bmiCategory = "Obese";
    }
    document.getElementById('bmiMarker').style.left = `${bmiPosition}%`;
    document.getElementById('bmiValue').textContent = `BMI: ${bmi.toFixed(1)}`;
    document.getElementById('bmiCategory').textContent = bmiCategory;
    
    // Update PI marker position and category
    let piPosition;
    let piCategory;
    if (pi < 11) {
        piPosition = (pi / 11) * 25;
        piCategory = "Underweight";
    } else if (pi < 15) {
        piPosition = 25 + ((pi - 11) / 4) * 25;
        piCategory = "Normal";
    } else if (pi < 17) {
        piPosition = 50 + ((pi - 15) / 2) * 25;
        piCategory = "Overweight";
    } else {
        piPosition = 75 + Math.min(((pi - 17) / 3) * 25, 25);
        piCategory = "Obese";
    }
    document.getElementById('piMarker').style.left = `${piPosition}%`;
    document.getElementById('piValue').textContent = `PI: ${pi.toFixed(1)}`;
    document.getElementById('piCategory').textContent = piCategory;
    
    // Update results
    document.getElementById('bmrResult').textContent = `${Math.round(bmr)} kcal`;
    document.getElementById('tdeeResult').textContent = `${Math.round(tdee)} kcal`;
    document.getElementById('intakeResult').textContent = `${Math.round(dailyCalorieIntake)} kcal`;
    document.getElementById('deficitResult').textContent = `${Math.round(Math.abs(dailyCalorieDeficit))} kcal ${weightDiffKg > 0 ? 'deficit' : 'surplus'}`;
    
    // Format time to goal
    let timeToGoalText;
    if (daysToGoal < 30) {
        timeToGoalText = `${daysToGoal} days`;
    } else if (daysToGoal < 365) {
        const weeks = Math.floor(daysToGoal / 7);
        const remainingDays = daysToGoal % 7;
        timeToGoalText = `${weeks} weeks${remainingDays > 0 ? ` and ${remainingDays} days` : ''}`;
    } else {
        const years = Math.floor(daysToGoal / 365);
        const remainingDays = daysToGoal % 365;
        const months = Math.floor(remainingDays / 30);
        timeToGoalText = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` and ${months} month${months > 1 ? 's' : ''}` : ''}`;
    }
    document.getElementById('timeToGoalResult').textContent = timeToGoalText;
    
    // Show results section
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('resultsSection').classList.add('block');
    
    // Calculate macros
    calculateMacros();
    
    // Generate weight progress chart
    generateWeightChart(currentWeight, desiredWeight, daysToGoal);
    
    // Update net calories summary
    updateNetCaloriesSummary();
}
function calculateMacros() {
    const currentWeight = parseFloat(document.getElementById('currentWeight').value);
    const currentWeightKg = isKg ? currentWeight : currentWeight / 2.20462;
    const dailyCalorieIntake = parseFloat(document.getElementById('intakeResult').textContent);
    const proteinRatio = parseFloat(document.getElementById('proteinIntake').value);
    
    // Calculate protein
    const proteinGrams = Math.round(currentWeightKg * proteinRatio);
    const proteinCalories = proteinGrams * 4;
    const proteinPortions = (proteinGrams / 20).toFixed(1);
    const proteinMeals = (proteinGrams / 60).toFixed(1);
    
    // Calculate fat (30% of total calories)
    const fatCalories = Math.round(dailyCalorieIntake * 0.3);
    const fatGrams = Math.round(fatCalories / 9);
    const fatPortions = (fatGrams / 10).toFixed(1);
    const fatMeals = (fatGrams / 30).toFixed(1);
    
    // Calculate carbs (remaining calories)
    const carbCalories = Math.round(dailyCalorieIntake - proteinCalories - fatCalories);
    const carbGrams = Math.round(carbCalories / 4);
    const carbPortions = (carbGrams / 20).toFixed(1);
    const carbMeals = (carbGrams / 60).toFixed(1);
    
    // Update macro results
    document.getElementById('proteinGrams').textContent = `${proteinGrams} g`;
    document.getElementById('proteinCalories').textContent = `${proteinCalories} kcal`;
    document.getElementById('proteinPortions').textContent = proteinPortions;
    document.getElementById('proteinMeals').textContent = proteinMeals;
    
    document.getElementById('fatGrams').textContent = `${fatGrams} g`;
    document.getElementById('fatCalories').textContent = `${fatCalories} kcal`;
    document.getElementById('fatPortions').textContent = fatPortions;
    document.getElementById('fatMeals').textContent = fatMeals;
    
    document.getElementById('carbGrams').textContent = `${carbGrams} g`;
    document.getElementById('carbCalories').textContent = `${carbCalories} kcal`;
    document.getElementById('carbPortions').textContent = carbPortions;
    document.getElementById('carbMeals').textContent = carbMeals;
}

function generateWeightChart(currentWeight, desiredWeight, daysToGoal) {
    const ctx = document.getElementById('weightChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (weightChart) {
        weightChart.destroy();
    }
    
    // Generate data points for the chart
    const labels = [];
    const data = [];
    const weightDiff = desiredWeight - currentWeight;
    const dailyChange = weightDiff / daysToGoal;
    
    // Determine if we should use days or weeks based on duration
    const useWeeks = daysToGoal > 45;
    const interval = useWeeks ? 7 : 1;
    const labelPrefix = useWeeks ? 'Week ' : 'Day ';
    const pointCount = useWeeks ? Math.ceil(daysToGoal / 7) : daysToGoal;
    
    // Create data points
    const maxPoints = 20; // Maximum number of points to show
    const step = Math.max(1, Math.floor(pointCount / maxPoints));
    
    for (let i = 0; i <= pointCount; i += step) {
        const day = useWeeks ? i * 7 : i;
        if (day <= daysToGoal) {
            const label = `${labelPrefix}${i}`;
            const weight = currentWeight + (dailyChange * day);
            labels.push(label);
            data.push(weight);
        }
    }
    
    // Add the final point if not already included
    if ((pointCount % step !== 0) || (labels[labels.length - 1] !== `${labelPrefix}${Math.floor(pointCount)}`)) {
        labels.push(useWeeks ? `Week ${Math.ceil(daysToGoal / 7)}` : `Day ${daysToGoal}`);
        data.push(desiredWeight);
    }
    
    // Create chart
    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Weight (${isKg ? 'kg' : 'lbs'})`,
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#3b82f6',
                    bodyColor: '#333',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Weight: ${context.raw.toFixed(1)} ${isKg ? 'kg' : 'lbs'}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: `Weight (${isKg ? 'kg' : 'lbs'})`,
                        color: '#64748b',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: useWeeks ? 'Weeks' : 'Days',
                        color: '#64748b',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
function calculateActivityCalories() {
    const metValue = parseFloat(document.getElementById('metValue').value) || 0;
    const duration = parseFloat(document.getElementById('activityDuration').value) || 0;
    const currentWeight = parseFloat(document.getElementById('currentWeight').value) || 0;
    
    if (metValue && duration && currentWeight) {
        const weightKg = isKg ? currentWeight : currentWeight / 2.20462;
        const calories = Math.round(metValue * duration * weightKg);
        document.getElementById('activityCalories').value = calories;
    } else {
        document.getElementById('activityCalories').value = '';
    }
}

function addActivity() {
    const activityName = document.getElementById('activityInput').value;
    const metValue = parseFloat(document.getElementById('metValue').value) || 0;
    const duration = parseFloat(document.getElementById('activityDuration').value) || 0;
    const calories = parseInt(document.getElementById('activityCalories').value) || 0;
    
    if (!activityName || metValue === 0 || calories === 0) {
        alert('Please enter an activity name, MET value, duration, and ensure calories are calculated.');
        return;
    }
    
    // Create a unique ID for this activity
    const activityId = Date.now();
    
    // Add to activity list
    activityList.push({
        id: activityId,
        name: activityName,
        met: metValue,
        duration: duration,
        calories: calories
    });
    
    // Update the UI
    updateActivityList();
    
    // Reset form
    document.getElementById('activityInput').value = '';
    document.getElementById('metValue').value = '';
    document.getElementById('activityDuration').value = '';
    document.getElementById('activityCalories').value = '';
    
    // Update net calories summary
    updateNetCaloriesSummary();
}

function deleteActivity(id) {
    activityList = activityList.filter(activity => activity.id !== id);
    updateActivityList();
    updateNetCaloriesSummary();
}

function updateActivityList() {
    const listElement = document.getElementById('savedActivitiesList');
    const noActivitiesRow = document.getElementById('noActivitiesRow');
    const totalCaloriesElement = document.getElementById('totalActivityCalories');
    
    // Clear the list
    while (listElement.firstChild) {
        listElement.removeChild(listElement.firstChild);
    }
    
    // Show "no activities" message if list is empty
    if (activityList.length === 0) {
        listElement.appendChild(noActivitiesRow);
        totalCaloriesElement.textContent = '0';
        return;
    }
    
    // Add each activity to the table
    let totalCalories = 0;
    activityList.forEach(activity => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        row.innerHTML = `
            <td class="py-2 px-4 border-b">${activity.name}</td>
            <td class="py-2 px-4 border-b text-right">${activity.met.toFixed(1)}</td>
            <td class="py-2 px-4 border-b text-right">${activity.duration.toFixed(1)}</td>
            <td class="py-2 px-4 border-b text-right">
                <input type="number" class="border rounded-md px-2 py-1 w-20 text-right" 
                       value="${activity.calories}" 
                       onchange="updateActivityCalories(${activity.id}, this.value)">
            </td>
            <td class="py-2 px-4 border-b text-center">
                <button class="text-red-600 hover:text-red-800" onclick="deleteActivity(${activity.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </td>
        `;
        
        listElement.appendChild(row);
        totalCalories += activity.calories;
    });
    
    // Update total calories
    totalCaloriesElement.textContent = totalCalories;
}

function updateActivityCalories(id, newCalories) {
    const activity = activityList.find(a => a.id === id);
    if (activity) {
        activity.calories = parseInt(newCalories) || 0;
        
        // Update total calories
        const totalCalories = activityList.reduce((sum, activity) => sum + activity.calories, 0);
        document.getElementById('totalActivityCalories').textContent = totalCalories;
        
        // Update net calories summary
        updateNetCaloriesSummary();
    }
}

function calculateFoodCalories() {
    const caloriesPerUnit = parseFloat(document.getElementById('foodCaloriesPerUnit').value) || 0;
    const portions = parseFloat(document.getElementById('foodPortions').value) || 0;
    
    if (caloriesPerUnit && portions) {
        const calories = Math.round(caloriesPerUnit * portions);
        document.getElementById('foodCalories').value = calories;
    } else {
        document.getElementById('foodCalories').value = '';
    }
}
function addFood() {
    const foodName = document.getElementById('foodInput').value;
    const foodType = document.getElementById('foodType').value;
    const caloriesPerUnit = parseFloat(document.getElementById('foodCaloriesPerUnit').value) || 0;
    const portions = parseFloat(document.getElementById('foodPortions').value) || 0;
    const calories = parseInt(document.getElementById('foodCalories').value) || 0;
    
    if (!foodName || caloriesPerUnit === 0 || calories === 0) {
        alert('Please enter a food name, calories per unit, portions, and ensure total calories are calculated.');
        return;
    }
    
    // Get the nutrient type display name
    let nutrientType;
    switch(foodType) {
        case 'carb':
            nutrientType = 'Carbohydrate';
            break;
        case 'fat':
            nutrientType = 'Fat';
            break;
        case 'protein':
            nutrientType = 'Protein';
            break;
        default:
            nutrientType = 'Other';
    }
    
    // Create a unique ID for this food
    const foodId = Date.now();
    
    // Add to food list
    foodList.push({
        id: foodId,
        name: foodName,
        type: nutrientType,
        portions: portions,
        calories: calories
    });
    
    // Update the UI
    updateFoodList();
    
    // Reset form
    document.getElementById('foodInput').value = '';
    document.getElementById('foodCaloriesPerUnit').value = '';
    document.getElementById('foodPortions').value = '';
    document.getElementById('foodCalories').value = '';
    
    // Update net calories summary
    updateNetCaloriesSummary();
}

function deleteFood(id) {
    foodList = foodList.filter(food => food.id !== id);
    updateFoodList();
    updateNetCaloriesSummary();
}

function updateFoodList() {
    const listElement = document.getElementById('savedFoodsList');
    const noFoodsRow = document.getElementById('noFoodsRow');
    const totalCaloriesElement = document.getElementById('totalFoodCalories');
    
    // Clear the list
    while (listElement.firstChild) {
        listElement.removeChild(listElement.firstChild);
    }
    
    // Show "no foods" message if list is empty
    if (foodList.length === 0) {
        listElement.appendChild(noFoodsRow);
        totalCaloriesElement.textContent = '0';
        return;
    }
    
    // Add each food to the table
    let totalCalories = 0;
    foodList.forEach(food => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        // Set row background color based on nutrient type
        let typeColor = '';
        switch(food.type) {
            case 'Carbohydrate':
                typeColor = 'text-cyan-700';
                break;
            case 'Fat':
                typeColor = 'text-orange-700';
                break;
            case 'Protein':
                typeColor = 'text-blue-700';
                break;
        }
        
        row.innerHTML = `
            <td class="py-2 px-4 border-b">${food.name}</td>
            <td class="py-2 px-4 border-b text-right ${typeColor} font-medium">${food.type}</td>
            <td class="py-2 px-4 border-b text-right">${food.portions.toFixed(1)}</td>
            <td class="py-2 px-4 border-b text-right">
                <input type="number" class="border rounded-md px-2 py-1 w-20 text-right" 
                       value="${food.calories}" 
                       onchange="updateFoodCalories(${food.id}, this.value)">
            </td>
            <td class="py-2 px-4 border-b text-center">
                <button class="text-red-600 hover:text-red-800" onclick="deleteFood(${food.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </td>
        `;
        
        listElement.appendChild(row);
        totalCalories += food.calories;
    });
    
    // Update total calories
    totalCaloriesElement.textContent = totalCalories;
}

function updateFoodCalories(id, newCalories) {
    const food = foodList.find(f => f.id === id);
    if (food) {
        food.calories = parseInt(newCalories) || 0;
        
        // Update total calories
        const totalCalories = foodList.reduce((sum, food) => sum + food.calories, 0);
        document.getElementById('totalFoodCalories').textContent = totalCalories;
        
        // Update net calories summary
        updateNetCaloriesSummary();
    }
}

function updateNetCaloriesSummary() {
    // Calculate totals
    const totalFoodCalories = foodList.reduce((sum, food) => sum + food.calories, 0);
    const totalActivityCalories = activityList.reduce((sum, activity) => sum + activity.calories, 0);
    const netCalories = totalFoodCalories - totalActivityCalories;
    
    // Update summary section
    document.getElementById('summaryFoodIntake').textContent = `${totalFoodCalories} kcal`;
    document.getElementById('summaryActivityBurned').textContent = `${totalActivityCalories} kcal`;
    document.getElementById('summaryNetCalories').textContent = `${netCalories} kcal`;
}

// Initialize tooltips if using them
document.addEventListener('DOMContentLoaded', function() {
    // Any initialization code can go here
    
    // Force Tailwind to reload styles if needed
    document.documentElement.classList.add('!block');
});