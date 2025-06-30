const requiredEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is required but not set.`);
    }
    return value;
}

const config = {
    PORT: process.env.PORT ?? 3000,
    DB_HOST: process.env.DB_HOST,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DIALECT: process.env.DB_DIALECT,
    BCRIPT_SALT_ROUNDS: +process.env.BCRYPT_SALT_ROUNDS,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_SECONDS: 60*60
}

export default config;