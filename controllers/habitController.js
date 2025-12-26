const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

// Log (toggle) completion for a habit for a specific date (defaults to today)
exports.logCompletion = async (req, res) => {
    try {
        const { date } = req.body; // Expects ISO date string or nothing for today
        const habitId = req.params.id;

        // Normalize date to Valid Date object set to start of day or passed date
        const logDate = date ? new Date(date) : new Date();
        logDate.setHours(0, 0, 0, 0);

        const habit = await Habit.findById(habitId);
        if (!habit) return res.status(404).json({ msg: 'Habit not found' });

        if (habit.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Check if log exists
        const existingLog = await HabitLog.findOne({
            habitId: habitId,
            date: logDate
        });

        if (existingLog) {
            // If exists, toggle completed or remove it. 
            // Let's toggle 'completed' status.
            existingLog.completed = !existingLog.completed;
            await existingLog.save();

            // Recalculate streak
            habit.streak = await calculateStreak(habitId);
            await habit.save();

            return res.json({ ...existingLog.toObject(), streak: habit.streak });
        }

        // Create new log
        const newLog = new HabitLog({
            habitId,
            date: logDate,
            completed: true
        });

        await newLog.save();

        // Recalculate streak
        habit.streak = await calculateStreak(habitId);
        await habit.save();

        res.json({ ...newLog.toObject(), streak: habit.streak });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Helper to calculate streak
async function calculateStreak(habitId) {
    const logs = await HabitLog.find({
        habitId,
        completed: true
    }).sort({ date: -1 });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If no logs, 0
    if (logs.length === 0) return 0;

    // Check if the most recent log is today or yesterday
    const lastLogDate = new Date(logs[0].date);
    lastLogDate.setHours(0, 0, 0, 0);

    // If the last completed log is older than yesterday, streak is broken (0) 
    // UNLESS we are calculating it right after marking today as complete.
    // Actually, simple iteration is safer:

    // Check if the continuity chain starts from today or yesterday
    if (lastLogDate.getTime() !== today.getTime() && lastLogDate.getTime() !== yesterday.getTime()) {
        return 0;
    }

    let expectedDate = lastLogDate;

    for (const log of logs) {
        const currentLogDate = new Date(log.date);
        currentLogDate.setHours(0, 0, 0, 0);

        if (currentLogDate.getTime() === expectedDate.getTime()) {
            streak++;
            // Move expected date back by 1 day
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            // Continuity broken
            break;
        }
    }
    return streak;
}



// Get completion logs for a habit (for charts/history)
exports.getHabitLogs = async (req, res) => {
    try {
        const logs = await HabitLog.find({ habitId: req.params.id }).sort({ date: -1 });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a new habit
exports.createHabit = async (req, res) => {
    try {
        const { title, frequency, targetDays } = req.body;

        const newHabit = new Habit({
            userId: req.user.id,
            title,
            frequency,
            targetDays
        });

        const habit = await newHabit.save();
        res.json(habit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get all habits for the logged in user
exports.getHabits = async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user.id, isArchived: false }).sort({ startDate: -1 });
        res.json(habits);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update a habit
exports.updateHabit = async (req, res) => {
    const { title, frequency, targetDays, isArchived } = req.body;

    // Build habit object
    const habitFields = {};
    if (title) habitFields.title = title;
    if (frequency) habitFields.frequency = frequency;
    if (targetDays) habitFields.targetDays = targetDays;
    if (typeof isArchived !== 'undefined') habitFields.isArchived = isArchived;

    try {
        let habit = await Habit.findById(req.params.id);

        if (!habit) return res.status(404).json({ msg: 'Habit not found' });

        // Make sure user owns habit
        if (habit.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        habit = await Habit.findByIdAndUpdate(req.params.id, { $set: habitFields }, { new: true });

        res.json(habit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete (archive) a habit
exports.deleteHabit = async (req, res) => {
    try {
        let habit = await Habit.findById(req.params.id);

        if (!habit) return res.status(404).json({ msg: 'Habit not found' });

        // Make sure user owns habit
        if (habit.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Instead of hard delete, we can soft delete (archive) or hard delete. 
        // User requirements said "Delete", but archiving might be safer for history. 
        // Let's implement hard delete for now to be simple as requested, or just remove.
        // Actually, let's remove it along with logs to keep DB clean as it is a simple app.

        await Habit.findByIdAndDelete(req.params.id);

        // Also remove logs
        await HabitLog.deleteMany({ habitId: req.params.id });

        res.json({ msg: 'Habit removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
