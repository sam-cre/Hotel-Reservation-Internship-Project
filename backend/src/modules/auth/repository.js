function mapSafeUser(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function createAuthRepository(database) {
  return {
    async createCustomer({ name, email, passwordHash }) {
      const result = await database.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, 'customer')
         RETURNING id::text, name, email, role, created_at`,
        [name, email, passwordHash],
      );
      return mapSafeUser(result.rows[0]);
    },

    async findAuthenticationRecordByEmail(email) {
      const result = await database.query(
        `SELECT id::text, name, email, password, role, created_at
         FROM users
         WHERE email = $1`,
        [email],
      );
      const row = result.rows[0];
      if (!row) return null;
      return { user: mapSafeUser(row), passwordHash: row.password };
    },

    async findUserById(id) {
      const result = await database.query(
        `SELECT id::text, name, email, role, created_at
         FROM users
         WHERE id = $1`,
        [id],
      );
      return mapSafeUser(result.rows[0]);
    },

    async updatePasswordHash(id, passwordHash) {
      await database.query('UPDATE users SET password = $1 WHERE id = $2', [
        passwordHash,
        id,
      ]);
    },
  };
}
