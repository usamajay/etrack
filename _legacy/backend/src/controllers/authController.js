const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Organization } = require('../models');

const register = async (req, res) => {
    try {
        const { email, password, full_name, phone, organization_name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create User
        const newUser = await User.create({
            email,
            password_hash,
            full_name,
            phone
        });

        // Create Default Organization for User
        if (organization_name) {
            await Organization.create({
                name: organization_name,
                owner_id: newUser.id
            });
        }

        // Generate Token
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        // Fetch user with organizations
        const user = await User.findByPk(newUser.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{ model: Organization }]
        });

        res.status(201).json({
            token,
            user
        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        // Check User
        const userCheck = await User.findOne({ where: { email } });
        if (!userCheck) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check Password
        const isMatch = await bcrypt.compare(password, userCheck.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign({ id: userCheck.id, role: userCheck.role }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        // Fetch user with organizations
        const user = await User.findByPk(userCheck.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{ model: Organization }]
        });

        res.json({
            token,
            user
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getMe = async (req, res) => {
    try {
        let user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{ model: Organization }]
        });

        // Self-healing: Create default organization if none exists
        if (!user.Organizations || user.Organizations.length === 0) {
            await Organization.create({
                name: 'My Organization',
                owner_id: user.id
            });

            // Refetch user
            user = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password_hash'] },
                include: [{ model: Organization }]
            });
        }

        res.json(user);
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { register, login, getMe };
