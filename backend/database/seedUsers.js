const { User } = require('../models');
const bcryptjs = require('bcryptjs');

const seedUsers = async () => {
    const users = [
        {
            fullName: 'Admin User',
            email: 'admin@interact.com',
            password: '123456',
            role: 'admin',
        },
        {
            fullName: 'Teacher User',
            email: 'teacher@interact.com',
            password: '123456',
            role: 'teacher',
        },
        {
            fullName: 'Student User',
            email: 'student@interact.com',
            password: '123456',
            role: 'student',
        },
    ];

    for (const userData of users) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
            const salt = bcryptjs.genSaltSync(10);
            userData.password = bcryptjs.hashSync(userData.password, salt);
            const user = new User(userData);
            await user.save();
            console.log(`Usuario creado: ${user.fullName}`);
        } else {
            console.log(`Usuario ya existe: ${existingUser.fullName}`);
        }
    }
};

module.exports = { seedUsers };