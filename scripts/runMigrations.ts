import { config } from 'dotenv'
import path from 'node:path'
import { Sequelize } from 'sequelize'
import { SequelizeStorage, Umzug } from 'umzug'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

config({ path: path.resolve(__dirname, '../.env') })

console.log('DB_PASS tipo:', typeof process.env.DB_PASS)
console.log('DB_PASS valor:', process.env.DB_PASS)

const sequelize = new Sequelize({
  database: process.env.DB_NAME!,
  username: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  host: process.env.DB_HOST!,
  dialect: 'postgres',
  logging: false,
})

const umzug = new Umzug({
      migrations: {
        glob: 'migrations/*.ts',
        resolve: ({ name, path: migrationPath, context }) => {
          if (!migrationPath) {
            throw new Error(`Migration path is undefined for ${name}`)
          }
          const absolutePath = path.resolve(__dirname, '..', migrationPath)
          return {
            name,
            up: async () => {
              const migration = await import(absolutePath)
              const up = migration.default?.up ?? migration.up
              return up(context)
            },
            down: async () => {
              const migration = await import(absolutePath)
              const down = migration.default?.down ?? migration.down
              return down(context)
            },
          }
        },
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    })

;(async () => {
  await umzug.up()
  console.log('✅ Migrações aplicadas com sucesso')
})()