import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export async function downloadBackupCodesPdf(
  backupCodes: string[],
  wizardName: string = "Wizard"
) {
  if (!backupCodes || backupCodes.length === 0) {
    throw new Error("No backup codes found");
  }

  const now = new Date().toLocaleString();

  const codesHtml = backupCodes
    .map(
      (code, index) => `
      <div class="codeRow">
        <span class="codeIndex">#${index + 1}</span>
        <span class="codeValue">${code}</span>
      </div>
    `
    )
    .join("");

  const html = `
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: Georgia, "Times New Roman", serif;
          padding: 24px;
          background: #f6f0d8;
          margin: 0;
        }

        .page {
          border: 3px solid #caa84a;
          border-radius: 18px;
          padding: 22px;
          background: linear-gradient(180deg, #fff6d8, #f2e5ba);
          box-shadow: 0 0 0 8px rgba(202, 168, 74, 0.12);
        }

        .title {
          text-align: center;
          font-size: 26px;
          font-weight: bold;
          color: #3b2a06;
          margin-bottom: 6px;
          letter-spacing: 1px;
        }

        .subtitle {
          text-align: center;
          font-size: 14px;
          color: #5a460f;
          margin-top: 0;
          margin-bottom: 18px;
        }

        .meta {
          font-size: 12px;
          color: #5a460f;
          text-align: center;
          margin-bottom: 16px;
        }

        .divider {
          height: 2px;
          background: rgba(60, 40, 0, 0.25);
          margin: 14px 0 18px 0;
        }

        .sectionTitle {
          font-size: 16px;
          font-weight: bold;
          color: #3b2a06;
          margin-bottom: 10px;
        }

        .codesBox {
          border: 2px dashed rgba(60, 40, 0, 0.35);
          border-radius: 14px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.35);
        }

        .codeRow {
          display: flex;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 12px;
          margin-bottom: 10px;
          background: rgba(202, 168, 74, 0.12);
          border: 1px solid rgba(202, 168, 74, 0.35);
        }

        .codeIndex {
          font-size: 12px;
          color: #4e3b0d;
          font-weight: bold;
          width: 52px;
        }

        .codeValue {
          font-size: 16px;
          font-weight: bold;
          color: #2b1d04;
          letter-spacing: 1px;
        }

        .warning {
          margin-top: 18px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(200, 0, 0, 0.08);
          border: 1px solid rgba(200, 0, 0, 0.25);
        }

        .warningTitle {
          font-weight: bold;
          color: #8b0000;
          margin-bottom: 6px;
        }

        .warningText {
          color: #5e0000;
          font-size: 13px;
          line-height: 1.4;
        }

        .footer {
          margin-top: 18px;
          font-size: 11px;
          color: rgba(60, 40, 0, 0.7);
          text-align: center;
        }
      </style>
    </head>

    <body>
      <div class="page">
        <div class="title">🪄 Wizard Backup Scroll</div>
        <p class="subtitle">2FA Recovery Codes for ESCAPE</p>

        <div class="meta">
          Issued for <b>${wizardName}</b> • ${now}
        </div>

        <div class="divider"></div>

        <div class="sectionTitle">✅ Your Backup Codes (One-time use each)</div>

        <div class="codesBox">
          ${codesHtml}
        </div>

        <div class="warning">
          <div class="warningTitle">⚠️ Important Security Warning</div>
          <div class="warningText">
            These backup codes can be used to log into your account if you lose your Authenticator app.
            <br/><br/>
            ✅ Keep them private.  
            ❌ Never share them with anyone.  
            ✅ Each code works only once.
          </div>
        </div>

        <div class="footer">
          ESCAPE Wizarding Security • Protect your wand, protect your vault ⚡
        </div>
      </div>
    </body>
  </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(uri);

  return true; // ✅ success for UI
}
