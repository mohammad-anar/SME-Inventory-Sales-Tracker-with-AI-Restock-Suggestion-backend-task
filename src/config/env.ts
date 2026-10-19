import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const env = {
  node_env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  ip_address: process.env.IP_ADDRESS,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_round: Number(process.env.BCRYPT_SALT_ROUND) || 10,
  cors_origin: process.env.CORS_ORIGIN || "*",
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
  redis_url: process.env.REDIS_URL || "redis://localhost:6379",
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
  },
  email: {
    from: process.env.EMAIL_FROM || "",
    user: process.env.EMAIL_USER || "",
    port: process.env.EMAIL_PORT || "587",
    host: process.env.EMAIL_HOST || "",
    pass: process.env.EMAIL_PASS || "",
  },
  jwt: {
    jwt_secret: process.env.JWT_SECRET || "default_jwt_secret",
    jwt_expire_in: process.env.JWT_EXPIRE_IN || "1d",
    jwt_refresh_expire_in: process.env.JWT_REFRESH_EXPIRE_IN || "30d",
  },
  admin: {
    name: process.env.NAME || "Super Admin",
    email: process.env.EMAIL || "admin@example.com",
    phone: process.env.PHONE || "",
    password: process.env.PASSWORD || "admin123456",
    avatar: process.env.AVATAR || "",
  },
  gemini: {
    api_key: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  },
};

export default env;
