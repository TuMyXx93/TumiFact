process.env.NODE_ENV = 'test';
process.env.DB_USER = process.env.DB_USER || 'tumifact_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'tumifact_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_DATABASE = process.env.DB_DATABASE || 'tumifact_test';
process.env.PORT = process.env.PORT || '3001';
// DB 15 aislada para rate-limit en tests (evita contaminar counters de dev)
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380/15';
// Rate limits relajados para suites con muchos logins (31 tests, ~20 logins)
process.env.API_RATE_LIMIT = process.env.API_RATE_LIMIT || '10000';
