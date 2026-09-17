import { Resend } from 'resend';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function assertCertificateDocumentUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('CERTIFICATE_DOCUMENT_URL_INVALID');
  }

  const configuredHosts = (process.env.CERTIFICATE_DOWNLOAD_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const trustedHosts = configuredHosts.length > 0
    ? configuredHosts
    : ['storage.googleapis.com', 'firebasestorage.googleapis.com', 'lingolive.ai'];
  const trustedHost = trustedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));

  if (url.protocol !== 'https:' || !url.pathname.toLowerCase().endsWith('.pdf') || !trustedHost) {
    throw new Error('CERTIFICATE_DOCUMENT_URL_INVALID');
  }

  return url.toString();
}

export async function sendCertificateEmail(to: string, nomeAluno: string, urlCertificadoPdf: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'suporte@lingolive.ai';

  if (!apiKey) {
    throw new Error('EMAIL_PROVIDER_NOT_CONFIGURED');
  }

  const verifiedDocumentUrl = assertCertificateDocumentUrl(urlCertificadoPdf);
  const safeStudentName = escapeHtml(nomeAluno);

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: `LingoLive AI <${from}>`,
    to,
    subject: `Parabéns! Certificado de Proficiência LingoLive IA`,
    html: `
      <p>Olá, Encarregado de Educação,</p>
      <p>É com grande orgulho que informamos que o(a) <strong>${safeStudentName}</strong> concluiu com sucesso um novo nível de proficiência na nossa plataforma!</p>
      <p>O certificado oficial gerado pela nossa IA já está disponível para download no link abaixo:</p>
      <p><a href="${verifiedDocumentUrl}" style="padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">Descarregar Certificado PDF</a></p>
      <p>Estamos juntos,<br><strong>Equipa LingoLive AI</strong></p>
    `
  });

  if (error) {
    throw new Error(`EMAIL_SEND_FAILED: ${error.message}`);
  }
}
