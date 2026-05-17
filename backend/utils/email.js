// backend/utils/email.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(to, code) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'MyProfEduc <onboarding@resend.dev>', // 👈 Email par défaut de Resend pour les tests
            to: [to],
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
                </div>
            `
        });

        if (error) {
            console.error('Erreur Resend:', error);
            throw new Error(error.message);
        }

        console.log(`✅ Email de vérification envoyé à ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        throw error;
    }
}

module.exports = { sendVerificationEmail };
