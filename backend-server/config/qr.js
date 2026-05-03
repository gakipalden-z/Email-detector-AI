import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { User } from "../models/User.js";

export const setup2FA = async (req, res) => {
  const userId = req.user.id;

  const secret = speakeasy.generateSecret({ length: 20 });

  const qr = await QRCode.toDataURL(secret.otpauth_url);

  await User.findByIdAndUpdate(userId, {
    twoFactorSecret: secret.base32
  });

  res.json({
    qr,               // show this in frontend
    secret: secret.base32
  });
};