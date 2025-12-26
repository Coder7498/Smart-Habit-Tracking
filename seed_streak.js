const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Habit = require('./models/Habit');
const HabitLog = require('./models/HabitLog');

// Load environment variables
dotenv.config();

const seedStreak = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // 1. Get the most recently created habit
        const habit = await Habit.findOne().sort({ startDate: -1 });

        if (!habit) {
            console.log('No habits found! Please create a habit first on the dashboard.');
            process.exit(1);
        }

        console.log(`Found Habit: "${habit.title}"`);
        console.log('Generating 21 days of fake history...');

        // 2. Clear existing logs for this habit to avoid duplicates/conflicts
        await HabitLog.deleteMany({ habitId: habit._id });

        // 3. Create logs for the last 21 days
        const logs = [];
        const today = new Date();

        for (let i = 0; i < 21; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i); // Go back 'i' days
            d.setHours(0, 0, 0, 0);

            logs.push({
                habitId: habit._id,
                date: d,
                completed: true
            });
        }

        await HabitLog.insertMany(logs);

        // 4. Update the habit's streak count manually
        habit.streak = 21;
        await habit.save();

        console.log('Success! 🔥');
        console.log(`Updated "${habit.title}" to have a 21-day streak.`);
        console.log('Please refresh your dashboard to see the changes.');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedStreak();
