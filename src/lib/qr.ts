import QRCode from "qrcode";

export async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 256,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0a0a0a",
      light: "#ffffff",
    },
  });
}
