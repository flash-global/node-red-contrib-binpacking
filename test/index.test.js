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
      name: 'break',
      width: 100,
      height: 100,
      length: 120,
      weight: 400
    }
  ]
}

describe('Test related to binpacking', () => {
  test('If stackable no and bin height > item height and have 1 quantity', async () => {
    const response = await request(`${hostDemo}`).post('/').send(data)
    expect(response.body.result[0].success).toBe(true)
    const metrics = response.body.result[0].metrics
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

  test('If stackable no and bin height > item height and have 2 quantity', async () => {
    data.packages[0].quantity = 2
    const response = await request(`${hostDemo}`).post('/').send(data)
    expect(response.body.result[0].success).toBe(false)
    const metrics = response.body.result[0].metrics
    expect(metrics).toBeDefined()
    const expected = {
      usedVolume: 504000.000, // 2 * (60 * 60 * 70)
      totalVolume: 1200000.000, // 100 * 100 * 120
      availableVolume: 696000.000, // 1200000 - 504000
      usedWeight: 28.00, // 28
      totalWeight: 400.00, // 400
      availableWeight: 372.00 // 400 - 28
    }
    expect(metrics).toEqual(expected)
  })
})
