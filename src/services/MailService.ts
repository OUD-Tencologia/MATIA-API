import nodemailer from 'nodemailer';

export class MailService {
    private static transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        }
    });

    static async sendPasswordResetEmail(to: string, token: string) {
        const baseUrl = process.env.FRONTEND_URL;
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.MAIL_FROM,
            to,
            subject: 'Recuperação de Senha - MATIA',
            html: `
                <div style="font-family: sans-serif; max-width: 600px;">
                    <h2>Olá!</h2>
                    <p>Você solicitou a recuperação de senha para sua conta no sistema MATIA.</p>
                    <p>Clique no botão abaixo para escolher uma nova senha. <b>Este link é válido por apenas 1 hora.</b></p>
                    <a href="${resetLink}" 
                       style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                       Redefinir Minha Senha
                    </a>
                    <p>Se você não solicitou isso, ignore este e-mail.</p>
                    <hr>
                    <small>Este é um e-mail automático, por favor não responda.</small>
                </div>
            `,
        };

        return await this.transporter.sendMail(mailOptions);
    }
}