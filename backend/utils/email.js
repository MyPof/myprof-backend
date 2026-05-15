// backend/utils/email.js
const nodemailer = require('nodemailer');

// Configuration de l'envoi d'email avec Gmail
// Les identifiants sont lus depuis les variables d'environnement sur Render
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Votre email Gmail (myprofeduc@gmail.com)
        pass: process.env.EMAIL_PASS   // Le mot de passe d'application (16 caractères)
    }
});

/**
 * Envoie un email de vérification avec un code à 6 chiffres
 * @param {string} to - L'adresse email du destinataire
 * @param {string} code - Le code de vérification à 6 chiffres
 */
async function sendVerificationEmail(to, code) {
    const mailOptions = {
        from: `"MyProfEduc" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: '✅ Votre code de vérification MyProfEduc',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #3b82f6;">Bienvenue sur MyProfEduc !</h2>
                <p>Merci de vous être inscrit sur notre plateforme de cours particuliers.</p>
                <p>Voici votre code de vérification :</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 10px 20px; border-radius: 8px;">${code}</span>
                </div>
                <p>Ce code expire dans 24 heures.</p>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">MyProfEduc - Cours particuliers sans commission</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de vérification envoyé à ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi email:', error.message);
        throw error;
    }
}

module.exports = { sendVerificationEmail };
