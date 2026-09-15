import argon2 from 'argon2';

const argonOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function provisionAdministrator(client, administrator) {
  const passwordHash = await argon2.hash(administrator.password, argonOptions);
  const existing = await client.query(
    'SELECT id, role FROM users WHERE email = $1 FOR UPDATE',
    [administrator.email],
  );
  if (existing.rows[0] && existing.rows[0].role !== 'admin') {
    throw new Error(
      'Administrator email belongs to an existing customer account.',
    );
  }
  if (existing.rows[0]) {
    await client.query(
      'UPDATE users SET name = $1, password = $2 WHERE id = $3',
      [administrator.name, passwordHash, existing.rows[0].id],
    );
    return { created: false };
  }
  await client.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'admin')`,
    [administrator.name, administrator.email, passwordHash],
  );
  return { created: true };
}
