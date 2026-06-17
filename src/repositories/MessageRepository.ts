import Messages from '../models/messages.js'

export class MessageRepository {

    static async create(payload: any) {
        return await Messages.create(payload)
    }

    static async findById(id: string) {
        return await Messages.findByPk(id)
    }

    static async findAll() {
        return await Messages.findAll()
    }

    static async update(id: string, payload: any) {
        const [updatedRows] = await Messages.update(payload, { where: { id } })
        return updatedRows
    }

    static async delete(id: string) {
        return await Messages.destroy({ where: { id } })
    }
}