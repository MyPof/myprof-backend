require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { sendVerificationEmail } = require('./utils/email');

const app = express();

// ==========================================
// CONFIGURATION CORS - LA SOLUTION À VOTRE PROBLÈME
// ==========================================
app.use(cors({
    origin: '*', // Accepte les requêtes de n'importe quelle origine (Netlify)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ==========================================
// CONNEXION À LA BASE DE DONNÉES
// ==========================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
    if (err) console.error('❌ Erreur connexion DB:', err);
    else console.log('✅ Connecté à PostgreSQL');
});

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==========================================
// ROUTE DE TEST (SANTÉ)
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API MyProfEduc fonctionne !' });
});

// ==========================================
// ROUTE POUR RÉCUPÉRER LES ENSEIGNANTS
// ==========================================
app.get('/api/teachers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, subject, city, hourly_rate, experience_years, bio
            FROM teachers_public
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur chargement enseignants:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// INSCRIPTION (Étape 1 : Envoi du code)
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role, city } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationCode = generateCode();

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, city, verification_code, is_verified) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [name, email, passwordHash, role, city, verificationCode, false]
        );

        // Envoi de l'email (assurez-vous que votre fonction sendVerificationEmail est bien configurée)
        await sendVerificationEmail(email, verificationCode).catch(err => console.error('Erreur envoi email:', err));

        res.status(201).json({
            message: 'Un code de vérification a été envoyé à votre adresse email.',
            userId: result.rows[0].id
        });

    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
    }
});

// ==========================================
// VÉRIFICATION DU CODE (Étape 2)
// ==========================================
app.post('/api/auth/verify-code', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'Email et code requis.' });
    }

    try {
        const result = await pool.query(
            `SELECT id FROM users 
             WHERE email = $1 AND verification_code = $2 AND is_verified = false`,
            [email, code]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Code invalide ou compte déjà vérifié.' });
        }

        await pool.query(
            `UPDATE users SET is_verified = true, verification_code = NULL WHERE id = $1`,
            [result.rows[0].id]
        );

        res.json({ message: 'Compte vérifié avec succès ! Vous pouvez maintenant vous connecter.' });

    } catch (error) {
        console.error('Erreur vérification:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la vérification.' });
    }
});

// ==========================================
// CONNEXION
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }

        const user = result.rows[0];

        if (!user.is_verified) {
            return res.status(401).json({ error: 'Veuillez vérifier votre email avant de vous connecter.' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_temp',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                city: user.city
            }
        });

    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
    }
});

// ==========================================
// ROUTE PRINCIPALE POUR LE FRONTEND
// ==========================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 MyProfEduc démarré sur http://localhost:${PORT}`);
    console.log(`📁 Base de données: ${process.env.DATABASE_URL ? '✅ Connectée' : '❌ Non configurée'}`);
    console.log(`🔒 CORS: Toutes les origines sont autorisées`);
});
