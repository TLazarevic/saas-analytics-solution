const { mockDeep, mockReset } = require('jest-mock-extended')

const prisma = require('../prisma/client')
const prismaMock = prisma

jest.mock('../prisma/client', () => mockDeep())

beforeEach(() => {
    mockReset(prismaMock)
})

module.exports = { prismaMock }