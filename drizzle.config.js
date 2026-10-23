import "dotenv/config";

const config = {
    dialect: "postgresql",
    schema: "./apps/backend/src/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
      url: process.env.DATABASE_URL,
      connectionString:
        process.env.DATABASE_URL ,
    },
  };

export default config;

