/**
 * FitBlaqs Calculation Utilities
 * Centralized unit normalization and calculation logic for:
 * - Nutrition (Calories, Protein, Hydration)
 * - Training (Duration, Sets, Reps, Weight)
 * - Performance tracking
 * 
 * All calculations are background-only and do not modify UI elements.
 */

// ========================
// UNIT NORMALIZATION
// ========================

/**
 * Convert weight values to grams (base unit for all weight calculations)
 * mg → g = value / 1000
 * g → g = value
 * kg → g = value × 1000
 * lbs → g = value × 453.592
 */
export const normalizeToGrams = (value: number | string, unit: string): number => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue < 0) return 0;

  switch (unit?.toLowerCase()) {
    case 'mg':
      return numValue / 1000;
    case 'kg':
      return numValue * 1000;
    case 'lb':
    case 'lbs':
      return numValue * 453.592;
    case 'g':
    default:
      return numValue;
  }
};

/**
 * Convert liquid values to milliliters (base unit for hydration)
 * ml → ml = value
 * dl/dz → ml = value × 100
 * l/liter → ml = value × 1000
 */
export const normalizeToML = (value: number | string, unit: string): number => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue < 0) return 0;

  switch (unit?.toLowerCase()) {
    case 'dl':
    case 'dz':
      return numValue * 100;
    case 'l':
    case 'liter':
    case 'liters':
      return numValue * 1000;
    case 'ml':
    default:
      return numValue;
  }
};

/**
 * Format ml to liters with proper display (e.g., 1.2 L)
 */
export const formatMLToLiters = (ml: number): string => {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)} L`;
  }
  return `${Math.round(ml)} ml`;
};

/**
 * Format grams to appropriate unit (mg, g, kg)
 */
export const formatGrams = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} kg`;
  }
  if (grams < 1) {
    return `${Math.round(grams * 1000)} mg`;
  }
  return `${grams.toFixed(1)} g`;
};

// ========================
// NUTRITION CALCULATIONS
// ========================

/**
 * Parse nutrition notes JSON safely
 */
export const parseNutritionNotes = (notes: string | null): any => {
  if (!notes) return null;
  try {
    return JSON.parse(notes);
  } catch {
    // Legacy format fallback
    const waterMatch = notes.match(/Water: ([\d.]+)/);
    return waterMatch 
      ? { water: { value: parseFloat(waterMatch[1]), unit: 'ml', ml: parseFloat(waterMatch[1]) } } 
      : null;
  }
};

/**
 * Calculate calories from macros using standard formula:
 * Calories = (Protein × 4) + (Carbs × 4) + (Fats × 9)
 */
export const calculateCaloriesFromMacros = (
  proteinGrams: number,
  carbsGrams: number,
  fatsGrams: number
): number => {
  return Math.round((proteinGrams * 4) + (carbsGrams * 4) + (fatsGrams * 9));
};

/**
 * Calculate calories from per-100g values
 * Formula: (normalized_grams / 100) × calories_per_100g
 */
export const calculateCaloriesPer100g = (grams: number, caloriesPer100g: number): number => {
  if (grams <= 0 || caloriesPer100g <= 0) return 0;
  return Math.round((grams / 100) * caloriesPer100g);
};

/**
 * Extract hydration (water) from nutrition log notes
 */
export const extractHydrationFromNotes = (notes: string | null): number => {
  const parsed = parseNutritionNotes(notes);
  if (!parsed) return 0;

  let totalML = 0;

  // Check for water field
  if (parsed.water) {
    if (typeof parsed.water.ml === 'number') {
      totalML += parsed.water.ml;
    } else if (parsed.water.value) {
      totalML += normalizeToML(parsed.water.value, parsed.water.unit || 'ml');
    }
  }

  // Check for liquid field (supplements)
  if (parsed.liquid) {
    if (typeof parsed.liquid.ml === 'number') {
      totalML += parsed.liquid.ml;
    } else if (parsed.liquid.value) {
      totalML += normalizeToML(parsed.liquid.value, parsed.liquid.unit || 'ml');
    }
  }

  // Check for hydration category
  if (parsed.category === 'hydration' && parsed.water) {
    if (typeof parsed.water.ml === 'number') {
      totalML = parsed.water.ml; // Already counted above, but ensure it's captured
    }
  }

  return totalML;
};

/**
 * Extract protein from nutrition log (normalized to grams)
 */
export const extractProteinFromLog = (log: any): number => {
  let protein = log.protein || 0;
  const parsed = parseNutritionNotes(log.notes);
  
  if (parsed?.protein?.value) {
    const normalizedProtein = normalizeToGrams(parsed.protein.value, parsed.protein.unit || 'g');
    // Use the higher value (could be stored in either place)
    protein = Math.max(protein, normalizedProtein);
  }
  
  // For vegan/vegetarian, fiber is treated as protein
  if (parsed?.fiber?.value && (parsed.category === 'vegetarian' || parsed.category === 'vegan')) {
    const normalizedFiber = normalizeToGrams(parsed.fiber.value, parsed.fiber.unit || 'g');
    protein = Math.max(protein, normalizedFiber);
  }

  return protein;
};

// ========================
// DAILY CALCULATIONS
// ========================

export interface DailyNutritionTotals {
  calories: number;
  protein: number;
  hydration: number;
  carbs: number;
  fats: number;
  vitamins: number;
  hasData: boolean;
}

/**
 * Calculate daily nutrition totals from nutrition logs
 * Only includes values saved for the selected calendar day
 */
export const calculateDailyNutrition = (
  nutritionLogs: any[],
  selectedDate: Date
): DailyNutritionTotals => {
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const dayLogs = nutritionLogs.filter(log => {
    const logDate = new Date(log.completed_at);
    return logDate >= dayStart && logDate <= dayEnd;
  });

  let calories = 0;
  let protein = 0;
  let hydration = 0;
  let carbs = 0;
  let fats = 0;
  let vitamins = 0;

  dayLogs.forEach(log => {
    // Calories
    calories += log.calories || 0;
    
    // Protein
    protein += extractProteinFromLog(log);
    
    // Carbs and Fats
    carbs += log.carbs || 0;
    fats += log.fats || 0;
    
    // Hydration from notes
    hydration += extractHydrationFromNotes(log.notes);
    
    // Vitamins from notes
    const parsed = parseNutritionNotes(log.notes);
    if (parsed?.vitamin?.value) {
      vitamins += normalizeToGrams(parsed.vitamin.value, parsed.vitamin.unit || 'mg');
    }
  });

  return {
    calories,
    protein,
    hydration,
    carbs,
    fats,
    vitamins,
    hasData: dayLogs.length > 0
  };
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// ========================
// TRAINING CALCULATIONS
// ========================

export interface TrainingDuration {
  totalMinutes: number;
  workoutMinutes: number;
  joggingMinutes: number;
  totalHours: number;
}

/**
 * Parse workout start/end time from notes to calculate duration
 */
export const parseWorkoutDuration = (notes: string | null): number => {
  if (!notes) return 0;
  
  try {
    const parsed = JSON.parse(notes);
    if (parsed.startTime && parsed.endTime) {
      const start = new Date(`1970-01-01T${parsed.startTime}`);
      const end = new Date(`1970-01-01T${parsed.endTime}`);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs > 0) {
        return Math.round(diffMs / 60000); // Convert to minutes
      }
    }
  } catch {
    // Try regex fallback
    const durationMatch = notes.match(/Duration:\s*(\d+)\s*min/i);
    if (durationMatch) {
      return parseInt(durationMatch[1]);
    }
  }
  
  return 0;
};

/**
 * Calculate daily training duration from logs
 */
export const calculateDailyTrainingDuration = (
  workoutLogs: any[],
  joggingLogs: any[],
  selectedDate: Date
): TrainingDuration => {
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Filter logs for selected day
  const dayWorkouts = workoutLogs.filter(w => {
    const d = new Date(w.completed_at);
    return d >= dayStart && d <= dayEnd;
  });

  const dayJogging = joggingLogs.filter(j => {
    const d = new Date(j.completed_at);
    return d >= dayStart && d <= dayEnd;
  });

  // Calculate workout minutes
  let workoutMinutes = 0;
  dayWorkouts.forEach(w => {
    const parsedDuration = parseWorkoutDuration(w.notes);
    if (parsedDuration > 0) {
      workoutMinutes += parsedDuration;
    } else {
      // Estimate: 3 minutes per set as fallback
      workoutMinutes += (w.sets || 1) * 3;
    }
  });

  // Calculate jogging minutes
  let joggingMinutes = 0;
  dayJogging.forEach(j => {
    const duration = j.duration || 0;
    // If > 100, assume seconds, otherwise minutes
    joggingMinutes += duration > 100 ? duration / 60 : duration;
  });

  const totalMinutes = Math.round(workoutMinutes + joggingMinutes);

  return {
    totalMinutes,
    workoutMinutes: Math.round(workoutMinutes),
    joggingMinutes: Math.round(joggingMinutes),
    totalHours: Math.round((totalMinutes / 60) * 10) / 10
  };
};

/**
 * Calculate monthly training hours for performance chart
 */
export const calculateMonthlyTrainingHours = (
  workoutLogs: any[],
  joggingLogs: any[],
  year: number
): { month: string; hours: number }[] => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return monthNames.map((month, index) => {
    const monthWorkouts = workoutLogs.filter(w => {
      const d = new Date(w.completed_at);
      return d.getMonth() === index && d.getFullYear() === year;
    });

    const monthJogging = joggingLogs.filter(j => {
      const d = new Date(j.completed_at);
      return d.getMonth() === index && d.getFullYear() === year;
    });

    // Calculate workout hours
    let workoutHours = 0;
    monthWorkouts.forEach(w => {
      const parsedDuration = parseWorkoutDuration(w.notes);
      if (parsedDuration > 0) {
        workoutHours += parsedDuration / 60;
      } else {
        workoutHours += (w.sets || 1) * 3 / 60;
      }
    });

    // Calculate jogging hours
    let joggingHours = 0;
    monthJogging.forEach(j => {
      const duration = j.duration || 0;
      joggingHours += duration > 100 ? duration / 3600 : duration / 60;
    });

    return {
      month,
      hours: Math.min(Math.round((workoutHours + joggingHours) * 10) / 10, 100)
    };
  });
};

// ========================
// CHALLENGE CALCULATIONS
// ========================

export interface ChallengeStats {
  weeklyLoss: number;
  monthlyLoss: number;
  projectedDaysToGoal: number;
  onTrack: boolean;
  recommendedDailyDeficit: number;
  progress: number;
  daysRemaining: number;
}

/**
 * Calculate challenge progress and statistics
 */
export const calculateChallengeStats = (
  savedGoal: { goal: number; months: number; startWeight: number; startDate: string },
  currentWeight: number
): ChallengeStats => {
  const startDate = new Date(savedGoal.startDate);
  const now = new Date();
  const daysPassed = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  const totalToLose = savedGoal.startWeight - savedGoal.goal;
  const alreadyLost = savedGoal.startWeight - currentWeight;
  const remaining = Math.max(0, totalToLose - alreadyLost);

  // Average daily weight loss
  const dailyLoss = alreadyLost / daysPassed;
  const weeklyLoss = dailyLoss * 7;
  const monthlyLoss = dailyLoss * 30;

  // Projected days to goal
  const projectedDaysToGoal = dailyLoss > 0 ? Math.ceil(remaining / dailyLoss) : 9999;

  // Days remaining until deadline
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + savedGoal.months);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Is user on track?
  const onTrack = projectedDaysToGoal <= daysRemaining;

  // Recommended daily deficit (7700 kcal = 1kg fat)
  const requiredDailyLoss = remaining / Math.max(1, daysRemaining);
  const recommendedDailyDeficit = Math.round(requiredDailyLoss * 7700);

  // Progress percentage
  const progress = totalToLose <= 0 ? 100 : Math.min(100, Math.max(0, (alreadyLost / totalToLose) * 100));

  return {
    weeklyLoss: Math.round(weeklyLoss * 100) / 100,
    monthlyLoss: Math.round(monthlyLoss * 100) / 100,
    projectedDaysToGoal,
    onTrack,
    recommendedDailyDeficit: Math.min(1000, Math.max(250, recommendedDailyDeficit)),
    progress,
    daysRemaining
  };
};

// ========================
// DAILY PLANNER FORMAT
// ========================

export interface DailyPlannerEntry {
  source: string;
  value: number | string;
  unit: string;
  displayText: string;
}

/**
 * Format entries for Daily Planner display
 * Format: [Page Name] [Value] [Unit]
 */
export const formatDailyPlannerEntries = (
  nutritionLogs: any[],
  workoutLogs: any[],
  joggingLogs: any[],
  weightLogs: any[],
  selectedDate: Date,
  isGerman: boolean
): DailyPlannerEntry[] => {
  const entries: DailyPlannerEntry[] = [];
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Filter for selected day
  const dayNutrition = nutritionLogs.filter(n => {
    const d = new Date(n.completed_at);
    return d >= dayStart && d <= dayEnd;
  });

  const dayWorkouts = workoutLogs.filter(w => {
    const d = new Date(w.completed_at);
    return d >= dayStart && d <= dayEnd;
  });

  const dayJogging = joggingLogs.filter(j => {
    const d = new Date(j.completed_at);
    return d >= dayStart && d <= dayEnd;
  });

  const dayWeight = weightLogs.filter(w => {
    const d = new Date(w.measured_at);
    return d >= dayStart && d <= dayEnd;
  });

  // Nutrition entries
  dayNutrition.forEach(n => {
    if (n.calories > 0) {
      entries.push({
        source: 'Nutrition',
        value: n.calories,
        unit: 'kcal',
        displayText: `Nutrition ${n.calories} kcal`
      });
    }

    // Check for hydration
    const hydration = extractHydrationFromNotes(n.notes);
    if (hydration > 0) {
      entries.push({
        source: 'Hydration',
        value: hydration >= 1000 ? (hydration / 1000).toFixed(1) : hydration,
        unit: hydration >= 1000 ? 'l' : 'ml',
        displayText: `Hydration ${formatMLToLiters(hydration)}`
      });
    }

    // Check for protein
    const protein = extractProteinFromLog(n);
    if (protein > 0) {
      entries.push({
        source: 'Protein',
        value: protein,
        unit: 'g',
        displayText: `Protein ${protein.toFixed(1)} g`
      });
    }
  });

  // Jogging entries
  dayJogging.forEach(j => {
    entries.push({
      source: 'Jogging Tracker',
      value: j.distance,
      unit: 'km',
      displayText: `Jogging Tracker ${j.distance} km`
    });
  });

  // Training entries
  dayWorkouts.forEach(w => {
    const exerciseName = w.notes?.split(" (")[0] || 'Training';
    entries.push({
      source: isGerman ? 'Trainingstag' : 'Training Day',
      value: `${w.sets}×${w.reps}`,
      unit: w.weight ? `${w.weight}${w.unit || 'kg'}` : '',
      displayText: `${isGerman ? 'Trainingstag' : 'Training Day'} ${exerciseName} ${w.sets}×${w.reps}`
    });
  });

  // Weight entries
  dayWeight.forEach(w => {
    entries.push({
      source: 'Weight',
      value: w.weight,
      unit: 'kg',
      displayText: `Weight ${w.weight} kg`
    });
  });

  return entries;
};

// ========================
// PERFORMANCE PAGE HELPERS
// ========================

/**
 * Calculate performance bar height based on training data
 * Bar height depends on stored training time, repetitions, or distance
 */
export const calculatePerformanceBarHeight = (
  totalHours: number,
  maxScale: number = 100
): number => {
  // Cap at max scale
  return Math.min(totalHours, maxScale);
};

/**
 * Calculate monthly completion percentage for popup
 */
export const calculateMonthlyCompletionPercentage = (
  workoutLogs: any[],
  joggingLogs: any[],
  month: number,
  year: number,
  targetDays: number = 20 // Default: 20 training days per month
): number => {
  const uniqueDays = new Set<string>();

  workoutLogs.forEach(w => {
    const d = new Date(w.completed_at);
    if (d.getMonth() === month && d.getFullYear() === year) {
      uniqueDays.add(d.toISOString().split('T')[0]);
    }
  });

  joggingLogs.forEach(j => {
    const d = new Date(j.completed_at);
    if (d.getMonth() === month && d.getFullYear() === year) {
      uniqueDays.add(d.toISOString().split('T')[0]);
    }
  });

  return Math.min(100, Math.round((uniqueDays.size / targetDays) * 100));
};

// ========================
// WEIGHT WATCHER DONUT CHART
// ========================

export interface DonutChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
  targetPercentage?: number;
}

/**
 * Generate donut chart data for Weight Watcher display
 * Three charts: Calories, Hydration, Protein
 */
export const generateDonutChartData = (
  dailyTotals: DailyNutritionTotals,
  dailyTargets: { calories: number; hydration: number; protein: number } = {
    calories: 2000,
    hydration: 2000, // ml
    protein: 50 // g
  }
): {
  calories: DonutChartData[];
  hydration: DonutChartData[];
  protein: DonutChartData[];
} => {
  const caloriesPercentage = Math.min(100, (dailyTotals.calories / dailyTargets.calories) * 100);
  const hydrationPercentage = Math.min(100, (dailyTotals.hydration / dailyTargets.hydration) * 100);
  const proteinPercentage = Math.min(100, (dailyTotals.protein / dailyTargets.protein) * 100);

  return {
    calories: [
      { name: 'Consumed', value: dailyTotals.calories, color: '#F97316', percentage: caloriesPercentage },
      { name: 'Remaining', value: Math.max(0, dailyTargets.calories - dailyTotals.calories), color: '#374151', percentage: 100 - caloriesPercentage }
    ],
    hydration: [
      { name: 'Consumed', value: dailyTotals.hydration, color: '#3B82F6', percentage: hydrationPercentage },
      { name: 'Remaining', value: Math.max(0, dailyTargets.hydration - dailyTotals.hydration), color: '#374151', percentage: 100 - hydrationPercentage }
    ],
    protein: [
      { name: 'Consumed', value: dailyTotals.protein, color: '#22C55E', percentage: proteinPercentage },
      { name: 'Remaining', value: Math.max(0, dailyTargets.protein - dailyTotals.protein), color: '#374151', percentage: 100 - proteinPercentage }
    ]
  };
};

// ========================
// ERROR HANDLING
// ========================

/**
 * Safe number parsing with fallback
 */
export const safeParseFloat = (value: any, fallback: number = 0): number => {
  if (value === null || value === undefined) return fallback;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Safe integer parsing with fallback
 */
export const safeParseInt = (value: any, fallback: number = 0): number => {
  if (value === null || value === undefined) return fallback;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Validate and sanitize nutrition log before saving
 */
export const validateNutritionLog = (log: any): boolean => {
  if (!log.food_name || typeof log.food_name !== 'string') return false;
  if (typeof log.calories !== 'number' || log.calories < 0) return false;
  return true;
};

/**
 * Handle calculation errors gracefully
 */
export const safeCalculation = <T>(
  calculation: () => T,
  fallback: T,
  errorMessage?: string
): T => {
  try {
    return calculation();
  } catch (error) {
    if (errorMessage) {
      console.error(errorMessage, error);
    }
    return fallback;
  }
};
