import { config } from 'dotenv'
import path from 'path'
import { Sequelize } from 'sequelize'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carrega o .env (DEBUG)
const envPath = path.resolve(process.cwd(), '.env')
config({ path: envPath })

let sequelize: Sequelize

// Use SQLite in-memory for test environment
if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
  })

  // Disable foreign key constraints for SQLite tests
  sequelize.addHook('afterConnect', async (connection: any) => {
    await connection.query('PRAGMA foreign_keys = OFF')
  })
} else {
  // Verifica se as variáveis de ambiente estão definidas
  if (!process.env.DB_NAME) throw new Error('DB_NAME não definido no .env')
  if (!process.env.DB_USER) throw new Error('DB_USER não definido no .env')
  if (!process.env.DB_PASS) throw new Error('DB_PASS não definido no .env')
  if (!process.env.DB_HOST) throw new Error('DB_HOST não definido no .env')
  if (!process.env.DB_PORT) throw new Error('DB_PORT não definido no .env')

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      dialect: 'postgres',
      logging: false, // desabilita logs de SQL por padrão
    }
  )
}

export default sequelize
