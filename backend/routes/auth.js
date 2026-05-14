const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

// Génère un code aléatoire à 6 chiffres
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==========================================
// 1. INSCRIPTION - Envoie un code par email
// ==========================================
router.post('/register', async (req, res) => {
    const { name, email, password, role, city, extra } = req.body;

    try {
        // Vérifier si l'email existe déjà
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        // Hacher le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Générer un code de vérification
        const verificationCode = generateCode();

        // Créer l'utilisateur (NON vérifié pour l'instant)
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, city, verification_code, is_verified) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [name, email, passwordHash, role, city, verificationCode, false]
        );

        // Envoyer le code par EMAIL RÉEL
        await sendVerificationEmail(email, verificationCode);

        // Si c'est un enseignant, créer son profil
        if (role === 'teacher' && extra) {
            await pool.query(
                `INSERT INTO teacher_profiles (user_id, subject, hourly_rate, experience_years, bio) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [result.rows[0].id, extra.subject, extra.rate, extra.experience || 0, extra.bio || '']
            );
        }

        // On retourne un message de succès, mais PAS de token (l'utilisateur n'est pas encore connecté)
        res.status(201).json({ 
            message: 'Un code de vérification a été envoyé à votre adresse email.', 
            userId: result.rows[0].id 
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
    }
});

// ==========================================
// 2. VÉRIFICATION - Valide le code reçu par email
// ==========================================
router.post('/verify-code', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'Email et code requis.' });
    }

    try {
        // Chercher l'utilisateur avec cet email et ce code, et qui n'est pas encore vérifié
        const result = await pool.query(
            `SELECT id FROM users 
             WHERE email = $1 AND verification_code = $2 AND is_verified = false`,
            [email, code]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Code invalide ou compte déjà vérifié.' });
        }

        // Marquer l'utilisateur comme vérifié et effacer le code
        await pool.query(
            `UPDATE users 
             SET is_verified = true, verification_code = NULL 
             WHERE id = $1`,
            [result.rows[0].id]
        );

        res.json({ message: 'Compte vérifié avec succès ! Vous pouvez maintenant vous connecter.' });

    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la vérification.' });
    }
});

// ==========================================
// 3. CONNEXION - Uniquement si le compte est vérifié
// ==========================================
router.post('/login', async (req, res) => {
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

        // Vérification 1 : Le compte a-t-il été vérifié par email ?
        if (!user.is_verified) {
            return res.status(401).json({ error: 'Veuillez vérifier votre email avant de vous connecter.' });
        }

        // Vérification 2 : Le mot de passe est-il correct ?
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }

        // Générer un token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Retourner le token et les infos utilisateur
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
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
    }
});

module.exports = router;