// backend/utils/email.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envoie un email de vérification avec un lien magique
 * @param {string} to - L'adresse email du destinataire
 * @param {string} token - Le token unique de vérification
 */
async function sendVerificationEmail(to, token) {
    // Lien de vérification (pointe vers votre frontend Netlify)
    const verificationLink = `https://moonlit-sopapillas-c75f39.netlify.app/verify?token=${token}`;
    
    try {
        const { data, error } = await resend.emails.send({
            from: 'MyProfEduc <useramine57@gmail.com>',
            to: [to],
            subject: '✅ Vérifiez votre email pour activer votre compte MyProfEduc',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Vérification MyProfEduc</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <span style="font-size: 48px;">🎓</span>
                            <h1 style="color: #3b82f6; margin: 10px 0 0 0;">MyProfEduc</h1>
                        </div>
                        
                        <h2 style="color: #333; text-align: center;">Bienvenue sur MyProfEduc !</h2>
                        
                        <p style="color: #555; line-height: 1.5;">Merci de vous être inscrit sur notre plateforme de cours particuliers sans commission.</p>
                        
                        <p style="color: #555; line-height: 1.5;">Pour activer votre compte, cliquez sur le bouton ci-dessous :</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activer mon compte</a>
                        </div>
                        
                        <p style="color: #555; line-height: 1.5;">Ou copiez ce lien dans votre navigateur :</p>
                        <p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${verificationLink}</p>
                        
                        <p style="color: #555; line-height: 1.5;">Ce lien expire dans 24 heures.</p>
                        
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                        
                        <p style="color: #888; font-size: 12px; text-align: center;">MyProfEduc - Cours particuliers sans commission</p>
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('❌ Erreur Resend:', error);
            return false;
        }

        console.log(`✅ Email de vérification envoyé à ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return false;
    }
}

module.exports = { sendVerificationEmail };
