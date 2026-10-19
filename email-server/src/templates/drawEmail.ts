export interface DrawEmailData {
  giverName: string;
  recipientName: string;
  raffleName: string;
  topic?: string;
  priceLimit: number;
  currency: string;
  giftDateFormatted: string;
  appUrl: string;
}

export function generateDrawEmailHtml(data: DrawEmailData): string {
  const {
    giverName,
    recipientName,
    raffleName,
    topic,
    priceLimit,
    currency,
    giftDateFormatted,
    appUrl,
  } = data;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Tu Amigo Invisible para ${raffleName}!</title>
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
      margin-bottom: 20px;
    }
    .match-card {
      background: #FEF2F2;
      border: 2px dashed #F87171;
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .match-label {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #B91C1C;
      margin-bottom: 8px;
    }
    .match-name {
      font-size: 28px;
      font-weight: 900;
      color: #111827;
      margin: 0;
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
      <div style="font-size: 40px; margin-bottom: 8px;">🎅🎁</div>
      <h1>¡Sorteo Realizado!</h1>
      <p>Amigo Invisible: <strong>${raffleName}</strong></p>
    </div>

    <div class="content">
      <p class="greeting">¡Hola <strong>${giverName}</strong>!</p>
      <p>Ya se han sorteado los nombres para <strong>${raffleName}</strong>. Aquí tienes tu asignación secreta:</p>

      <div class="match-card">
        <div class="match-label">Te ha tocado regalarle a:</div>
        <div class="match-name">${recipientName}</div>
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
        <a href="${appUrl}" class="cta-button" target="_blank">Ver Detalles en la App</a>
      </div>

      <p style="font-size: 13px; color: #6B7280; text-align: center; margin-top: 24px;">
        🤫 ¡Recuerda mantener el secreto hasta el día de la entrega de regalos!
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px 0;">Secret Santa • Amigo Invisible 2026</p>
      <p style="margin: 0;">Enviado automáticamente para los participantes de "${raffleName}".</p>
    </div>
  </div>
</body>
</html>`;
}
