// backend/utils/email.js
const nodemailer = require('nodemailer');

// Pour l'instant, on simule l'envoi (vous configurerez vos vrais identifiants plus tard)
async function sendVerificationEmail(to, code) {
    console.log(`📧 Simulation d'envoi d'email à ${to} avec le code: ${code}`);
    console.log(`👉 Code à 6 chiffres (pour test): ${code}`);
    return true;
}

module.exports = { sendVerificationEmail };
