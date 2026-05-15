// backend/utils/email.js
const sgMail = require('@sendgrid/mail');

/**
 * Envoie un email de vérification avec un code à 6 chiffres
 * Utilise SendGrid pour un envoi fiable et rapide
 */
async function sendVerificationEmail(to, code) {
    // Configurer la clé API SendGrid (lue depuis les variables d'environnement Render)
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
        to: to,  // L'email de l'utilisateur qui s'inscrit
        from: process.env.EMAIL_USER,  // myprofeduc@gmail.com
        subject: '✅ Votre code de vérification MyProfEduc',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Code de vérification MyProfEduc</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span style="font-size: 48px;">🎓</span>
                        <h1 style="color: #3b82f6; margin: 10px 0 0 0;">MyProfEduc</h1>
                    </div>
                    
                    <h2 style="color: #333; text-align: center;">Bienvenue sur MyProfEduc !</h2>
                    
                    <p style="color: #555; line-height: 1.5;">Merci de vous être inscrit sur notre plateforme de cours particuliers sans commission.</p>
                    
                    <p style="color: #555; line-height: 1.5;">Voici votre code de vérification pour activer votre compte :</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 42px; font-weight: bold; letter-spacing: 8px; background-color: #f0f0f0; padding: 15px 25px; border-radius: 8px; font-family: monospace;">${code}</span>
                    </div>
                    
                    <p style="color: #555; line-height: 1.5;">Ce code expire dans 24 heures.</p>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    
                    <p style="color: #888; font-size: 12px; text-align: center;">MyProfEduc - Cours particuliers sans commission<br>Cette entreprise est située à Paris, France.</p>
                </div>
            </body>
            </html>
        `
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Email de vérification envoyé avec succès à ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error.response?.body || error.message);
        throw error;
    }
}

module.exports = { sendVerificationEmail };
