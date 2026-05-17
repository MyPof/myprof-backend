// Version simplifiée et robuste avec Resend
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(to, code) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'MyProfEduc <onboarding@resend.dev>',
            to: [to],
            subject: '✅ Votre code de vérification MyProfEduc',
            html: `<div><h2>Bienvenue sur MyProfEduc !</h2><p>Votre code : <strong>${code}</strong></p></div>`
        });

        if (error) throw new Error(error.message);
        console.log(`✅ Email envoyé à ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur Resend:', error);
        return false; // Important : ne pas bloquer l'inscription si l'email échoue
    }
}

module.exports = { sendVerificationEmail };
