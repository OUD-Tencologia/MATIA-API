// Helper de teste: garante que TODOS os models estejam registrados no
// sequelize singleton (src/db.ts) antes de um `sequelize.sync({ force: true })`.
//
// Por que isso é necessário: vários controllers/services só referenciam um
// model de forma transitiva (às vezes via `import type`, que o TypeScript/
// esbuild elimina em tempo de build sem nenhum efeito em runtime). Isso faz
// com que `Model.init()` nunca rode para esse model, e `sequelize.sync()`
// simplesmente não cria a tabela dele — mesmo que o teste precise dela (ex:
// `profile.empresa_id` referencia `company`, mas nada no fluxo testado
// importa o model `Company` de verdade).
//
// Reaproveita o mesmo import usado em produção (`src/server.ts`) para montar
// o grafo de associações, em vez de manter uma lista solta e divergente.
// A importação de módulo é cacheada pelo Node, então isso roda uma única vez
// por worker mesmo sendo importado por vários arquivos de teste.
import '../../src/models/foreignKeys.js'
import '../../src/models/LlmConfig.js'
import { setupAssociations } from '../../src/models/setupAssociations.js'
import sequelize from '../../src/db.js'

setupAssociations()

export default sequelize
