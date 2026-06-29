import { describe, expect, it } from 'vitest'

import { getRagBaseUrl } from '../src/config/rag.js'

describe('getRagBaseUrl', () => {
    it('uses the internal Docker alias by default', () => {
        expect(getRagBaseUrl({})).toBe('http://api-rag:8001')
    })

    it('uses the configured URL and removes trailing slashes', () => {
        expect(getRagBaseUrl({ MATIA_RAG_BASE_URL: 'http://127.0.0.1:4001///' })).toBe(
            'http://127.0.0.1:4001',
        )
    })

    it('rejects non-HTTP URLs', () => {
        expect(() => getRagBaseUrl({ MATIA_RAG_BASE_URL: 'file:///tmp/rag' })).toThrow(
            'deve usar o protocolo http ou https',
        )
    })
})
