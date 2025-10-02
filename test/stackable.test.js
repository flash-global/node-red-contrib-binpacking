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
  test('package should fit in the second bin', async () => {
    const response = await request(`${hostDemo}`).post('/').send(data)
    expect(response.body.result[1].success).toBe(true)
    const metrics = response.body.result[1].metrics
    expect(metrics).toBeDefined()

    // usedVolume reflects original package dims (pre-stackable): 60 * 60 * 70
    const expected = {
      usedVolume: 252000.000, // 60 * 60 * 70
      totalVolume: 1200000.000, // 100 * 100 * 120
      availableVolume: 948000.000, // 1200000 - 252000
      usedWeight: 28.00, // 28
      totalWeight: 400.00, // 400
      availableWeight: 372.00 // 400 - 28
    }
    expect(metrics).toEqual(expected)
  })
})
