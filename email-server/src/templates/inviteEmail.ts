export interface InviteEmailData {
  inviteeName: string;
  organizerName: string;
  raffleName: string;
  inviteCode: string;
  topic?: string;
  priceLimit: number;
  currency: string;
  giftDateFormatted: string;
  inviteUrl: string;
}

export function generateInviteEmailHtml(data: InviteEmailData): string {
  const {
    inviteeName,
    organizerName,
    raffleName,
    inviteCode,
    topic,
    priceLimit,
    currency,
    giftDateFormatted,
    inviteUrl,
  } = data;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Estás invitado al Amigo Invisible ${raffleName}!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #F3F4F6;
      color: #1F2937;
    }
    .container {
      max-width: 580px;
      margin: 24px auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%);
      padding: 32px 24px;
      text-align: center;
      color: #FFFFFF;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 16px;
    }
    .code-box {
      background-color: #F9FAFB;
      border: 2px dashed #D1D5DB;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6B7280;
      margin-bottom: 6px;
      letter-spacing: 1px;
    }
    .code-value {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 6px;
      font-family: 'Courier New', Courier, monospace;
      color: #B91C1C;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    .details-table td {
      padding: 10px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .details-table td.label {
      color: #6B7280;
      font-weight: 500;
    }
    .details-table td.value {
      text-align: right;
      color: #111827;
      font-weight: 700;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #B91C1C;
      color: #FFFFFF !important;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(185, 28, 28, 0.3);
    }
    .footer {
      background-color: #F9FAFB;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
      border-top: 1px solid #E5E7EB;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 40px; margin-bottom: 8px;">💌✨</div>
      <h1>¡Estás Invitado!</h1>
      <p>Amigo Invisible: <strong>${raffleName}</strong></p>
    </div>

    <div class="content">
      <p class="greeting">¡Hola <strong>${inviteeName}</strong>!</p>
      <p><strong>${organizerName}</strong> te ha invitado a participar en el sorteo de Amigo Invisible para <strong>${raffleName}</strong>.</p>

      <div class="code-box">
        <div class="code-label">Tu Código de Invitación</div>
        <div class="code-value">${inviteCode}</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">📅 Fecha de entrega</td>
          <td class="value">${giftDateFormatted}</td>
        </tr>
        <tr>
          <td class="label">💰 Límite de presupuesto</td>
          <td class="value">${priceLimit} ${currency}</td>
        </tr>
        ${topic ? `
        <tr>
          <td class="label">🎯 Temática</td>
          <td class="value">${topic}</td>
        </tr>` : ''}
      </table>

      <div class="cta-container">
        <a href="${inviteUrl}" class="cta-button" target="_blank">Aceptar Invitación</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px 0;">Secret Santa • Amigo Invisible 2026</p>
      <p style="margin: 0;">Organizado por ${organizerName}.</p>
    </div>
  </div>
</body>
</html>`;
}
