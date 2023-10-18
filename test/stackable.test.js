const request = require('supertest')
const hostDemo = 'http://localhost:1880/binpacking'

const data = {
  packages: [
    {
      name: 'bh',
      width: 60,
      height: 60,
      length: 70,
      weight: 28,
      quantity: 1,
      stackable: 'no',
      allowedRotation: [
        0
      ]
    }
  ],
  bins: [
    {
      name: 'avion',
      width: 100,
      height: 200,
      length: 120,
      weight: 400
    },
    {
      name: 'break',
      width: 100,
      height: 100,
      length: 120,
      weight: 400
    }
  ]
}

describe('Test related to binpacking', () => {
  test('fail test', async () => {
    const response = await request(`${hostDemo}`).post('/').send(data)
    expect(response.body.result[1].success).toBe(true)
  })
})
