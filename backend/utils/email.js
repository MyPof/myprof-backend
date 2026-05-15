const sgMail = require('@sendgrid/mail');

async function sendVerificationEmail(to, code) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
        to: to,
        from: process.env.FROM_EMAIL,
        subject: '✅ Votre code de vérification MyProfEduc',
        html: `
            <div style="font-family: Arial; max-width: 600px;">
                <h2 style="color: #3b82f6;">Bienvenue sur MyProfEduc !</h2>
                <p>Voici votre code de vérification :</p>
                <div style="font-size: 32px; font-weight: bold; background: #f0f0f0; padding: 15px; text-align: center;">${code}</div>
                <p>Ce code expire dans 24 heures.</p>
            </div>
        `
    };
    
    await sgMail.send(msg);
    console.log(`✅ Email envoyé à ${to}`);
}

module.exports = { sendVerificationEmail };
