import crypto from "crypto";

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
};

export default hashToken;
