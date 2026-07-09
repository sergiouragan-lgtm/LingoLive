import nodemailer from 'nodemailer';

export async function sendCertificateEmail(to: string, nomeAluno: string, urlCertificadoPdf: string) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user || 'suporte@lingolive.ai';

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS environment variables are required for Nodemailer SMTP configuration.');
  }

  // Auto-detect service or configure general SMTP settings
  let transportConfig: any = {};
  
  if (user.includes('gmail.com')) {
    transportConfig = {
      service: 'gmail',
      auth: { user, pass }
    };
  } else if (user.includes('outlook.com') || user.includes('hotmail.com') || user.includes('live.com')) {
    transportConfig = {
      service: 'hotmail',
      auth: { user, pass }
    };
  } else if (user.includes('yahoo.com')) {
    transportConfig = {
      service: 'yahoo',
      auth: { user, pass }
    };
  } else {
    // Standard SMTP fallback configuration (e.g. host-based on domain or custom config)
    const domain = user.split('@')[1] || 'smtp.gmail.com';
    transportConfig = {
      host: process.env.EMAIL_HOST || `smtp.${domain}`,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for port 465, false for other ports
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  await transporter.sendMail({
    from: `LingoLive AI <${from}>`,
    to,
    subject: `Parabéns! Certificado de Proficiência LingoLive IA`,
    html: `
      <p>Olá, Encarregado de Educação,</p>
      <p>É com grande orgulho que informamos que o(a) <strong>${nomeAluno}</strong> concluiu com sucesso um novo nível de proficiência na nossa plataforma!</p>
      <p>O certificado oficial gerado pela nossa IA já está disponível para download no link abaixo:</p>
      <p><a href="${urlCertificadoPdf}" style="padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">Descarregar Certificado PDF</a></p>
      <p>Estamos juntos,<br><strong>Equipa LingoLive AI</strong></p>
    `
  });
}
