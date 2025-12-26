const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'daily'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    targetDays: {
        type: Number,
        default: 21 // Default challenge duration
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    streak: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Habit', HabitSchema);
