const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createHabit, getHabits, updateHabit, deleteHabit, logCompletion, getHabitLogs } = require('../controllers/habitController');

// All routes are protected
router.use(auth);

// @route   GET api/habits
// @desc    Get all users habits
// @access  Private
router.get('/', getHabits);

// @route   POST api/habits
// @desc    Add new habit
// @access  Private
router.post('/', createHabit);

// @route   POST api/habits/:id/complete
// @desc    Log completion for a habit
// @access  Private
router.post('/:id/complete', logCompletion);

// @route   GET api/habits/:id/logs
// @desc    Get logs for a habit
// @access  Private
router.get('/:id/logs', getHabitLogs);

// @route   PUT api/habits/:id
// @desc    Update habit
// @access  Private
router.put('/:id', updateHabit);

// @route   DELETE api/habits/:id
// @desc    Delete habit
// @access  Private
router.delete('/:id', deleteHabit);

module.exports = router;
