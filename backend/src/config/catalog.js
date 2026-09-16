import { z } from 'zod';

const schema = z.object({
  CATALOG_IMAGE_HOST_ALLOWLIST: z.string().default(''),
});

const hostPattern = /^[a-z0-9.-]+(:\d+)?$/;

function parseHosts(value) {
  const hosts = value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  for (const host of hosts) {
    if (!hostPattern.test(host))
      throw new Error(
        'Invalid catalog configuration: CATALOG_IMAGE_HOST_ALLOWLIST',
      );
  }
  if (new Set(hosts).size !== hosts.length)
    throw new Error(
      'Invalid catalog configuration: CATALOG_IMAGE_HOST_ALLOWLIST',
    );
  return new Set(hosts);
}

export function readCatalogEnvironment(source = process.env) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join('.'))),
    ];
    throw new Error(`Invalid catalog configuration: ${fields.join(', ')}`);
  }
  return {
    imageHostAllowlist: parseHosts(result.data.CATALOG_IMAGE_HOST_ALLOWLIST),
  };
}
