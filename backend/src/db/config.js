import { z } from 'zod';

const databaseUrl = z
  .string()
  .min(1)
  .refine((value) => /^postgres(?:ql)?:\/\//i.test(value), {
    message: 'must be a PostgreSQL URL',
  });

const databaseSchema = z.object({
  DATABASE_URL: databaseUrl,
  DATABASE_SSL: z.enum(['require', 'disable']).default('require'),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
});

const administratorSchema = z.object({
  ADMIN_NAME: z.string().trim().min(1).max(120),
  ADMIN_EMAIL: z.string().trim().toLowerCase().email().max(320),
  ADMIN_PASSWORD: z.string().min(12).max(256),
});

function parseConfiguration(schema, source, label) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join('.'))),
    ];
    throw new Error(`Invalid ${label} configuration: ${fields.join(', ')}`);
  }
  return result.data;
}

export function readDatabaseEnvironment(source = process.env) {
  const value = parseConfiguration(
    databaseSchema,
    source,
    'database environment',
  );
  return {
    connectionString: value.DATABASE_URL,
    ssl: value.DATABASE_SSL === 'require',
    poolMax: value.DATABASE_POOL_MAX,
  };
}

export function readAdministratorEnvironment(source = process.env) {
  const value = parseConfiguration(
    administratorSchema,
    source,
    'administrator provisioning',
  );
  return {
    name: value.ADMIN_NAME,
    email: value.ADMIN_EMAIL,
    password: value.ADMIN_PASSWORD,
  };
}
