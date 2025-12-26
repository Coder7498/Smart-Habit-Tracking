const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('./models/User');

const checkUsers = async () => {
    try {
        // Connect specifically to the local instance
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const users = await User.find({});
        console.log(`\nFound ${users.length} users:\n`);
        
        if (users.length === 0) {
            console.log("No users found. Try registering a user in the app first!");
        } else {
            users.forEach(user => {
                console.log(`Name: ${user.name}`);
                console.log(`Email: ${user.email}`);
                console.log(`ID: ${user._id}`);
                console.log('-------------------');
            });
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkUsers();
