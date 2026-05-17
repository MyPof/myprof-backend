// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Pool } = require('pg');
const { sendVerificationEmail } = require('./utils/email');

const app = express();

// ==========================================
// CONFIGURATION CORS
// ==========================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// ==========================================
// ROUTE DE TEST
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API MyProfEduc fonctionne !' });
});

// ==========================================
// ROUTE ENSEIGNANTS
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
// INSCRIPTION (envoie un email de vérification)
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role, city } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    try {
        // Vérifier si l'email existe déjà
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        // Hacher le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Générer un token de vérification
        const verificationToken = generateToken();

        // Créer l'utilisateur (non vérifié)
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, city, verification_token, is_verified) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [name, email, passwordHash, role, city, verificationToken, false]
        );

        // Envoyer l'email de vérification
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            message: 'Un email de vérification a été envoyé à votre adresse. Cliquez sur le lien pour activer votre compte.',
            userId: result.rows[0].id
        });

    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
    }
});

// ==========================================
// VÉRIFICATION PAR LIEN MAGIQUE
// ==========================================
app.get('/api/auth/verify', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Token manquant' });
    }

    try {
        // Chercher l'utilisateur avec ce token
        const result = await pool.query(
            `SELECT id FROM users 
             WHERE verification_token = $1 AND is_verified = false`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Lien invalide ou compte déjà vérifié.' });
        }

        // Activer le compte
        await pool.query(
            `UPDATE users 
             SET is_verified = true, verification_token = NULL 
             WHERE id = $1`,
            [result.rows[0].id]
        );

        // Rediriger vers le frontend avec un message de succès
        res.redirect('https://moonlit-sopapillas-c75f39.netlify.app?verification=success');
        
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

        const token = crypto.randomBytes(64).toString('hex');

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
// ROUTE PRINCIPALE
// ==========================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ==========================================
// DÉMARRAGE
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 MyProfEduc démarré sur http://localhost:${PORT}`);
    console.log(`📁 Base de données: ${process.env.DATABASE_URL ? '✅ Connectée' : '❌ Non configurée'}`);
});
