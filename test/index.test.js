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
    const bin = response.body.result[0].bin
    const binWidth = bin.width
    const binHeight = bin.height
    const binDepth = bin.depth
    const wScaled = binWidth
    const hScaled = binHeight
    const dScaled = binDepth
    const maxWeightScaled = bin.maxWeight
    const binVolumeScaled = binWidth * binHeight * binDepth
    expect(metrics).toBeDefined()
    expect(metrics.available_width).toBeGreaterThanOrEqual(0)
    expect(metrics.available_width).toBeLessThanOrEqual(wScaled)
    expect(metrics.available_depth).toBeGreaterThanOrEqual(0)
    expect(metrics.available_depth).toBeLessThanOrEqual(dScaled)
    expect(metrics.available_height).toBeGreaterThanOrEqual(0)
    expect(metrics.available_height).toBeLessThanOrEqual(hScaled)
    expect(metrics.available_volume).toBeGreaterThanOrEqual(0)
    expect(metrics.available_volume).toBeLessThanOrEqual(binVolumeScaled)
    expect(metrics.available_weight).toBeGreaterThanOrEqual(0)
    expect(metrics.available_weight).toBeLessThanOrEqual(maxWeightScaled)
  })

  test('If stackable no and bin height > item height and have 2 quantity', async () => {
    data.packages[0].quantity = 2
    const response = await request(`${hostDemo}`).post('/').send(data)
    expect(response.body.result[0].success).toBe(false)
    const metrics = response.body.result[0].metrics
    expect(metrics).toBeDefined()
    expect(metrics.available_width).toBeGreaterThanOrEqual(0)
    expect(metrics.available_height).toBeGreaterThanOrEqual(0)
    expect(metrics.available_depth).toBeGreaterThanOrEqual(0)
    expect(metrics.available_weight).toBeGreaterThanOrEqual(0)
  })
})
