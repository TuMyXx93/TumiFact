export const openApiDocument = {
  openapi: '3.1.0',
  info: { title: 'TumiFact API', version: '2.0.0' },
  servers: [{ url: '/api' }],
  security: [{ cookieAuth: [] }],
  paths: {
    '/health': {
      get: {
        security: [],
        responses: { '200': { description: 'Servicio activo' } },
      },
    },
    '/ready': {
      get: {
        security: [],
        responses: {
          '200': { description: 'Servicio listo' },
          '503': { description: 'Base de datos no disponible' },
        },
      },
    },
    '/auth/login': {
      post: {
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  email: { type: 'string' },
                  numero_identificacion: { type: 'string' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Autenticación exitosa' },
          '401': { description: 'Credenciales inválidas' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
    },
  },
} as const;
