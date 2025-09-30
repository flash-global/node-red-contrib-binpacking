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
    const bin = response.body.result[1].bin
    const binWidth = bin.width
    const binHeight = bin.height
    const binDepth = bin.depth
    const binVolumeScaled = (binWidth * binHeight * binDepth)
    const wScaled = binWidth
    const hScaled = binHeight
    const dScaled = binDepth
    const maxWeightScaled = bin.maxWeight
    expect(metrics).toBeDefined()
    expect(metrics.available_volume).toBeGreaterThanOrEqual(0)
    expect(metrics.available_volume).toBeLessThanOrEqual(binVolumeScaled)
    expect(metrics.available_length).toBeGreaterThanOrEqual(0)
    expect(metrics.available_length).toBeLessThanOrEqual(dScaled)
    expect(metrics.available_height).toBeGreaterThanOrEqual(0)
    expect(metrics.available_height).toBeLessThanOrEqual(hScaled)
    expect(metrics.available_depth).toBeGreaterThanOrEqual(0)
    expect(metrics.available_depth).toBeLessThanOrEqual(wScaled)
    expect(metrics.available_weight).toBeGreaterThanOrEqual(0)
    expect(metrics.available_weight).toBeLessThanOrEqual(maxWeightScaled)
    expect(metrics.percentage_available_volume).toBeGreaterThanOrEqual(0)
    expect(metrics.percentage_available_volume).toBeLessThanOrEqual(1)
    expect(metrics.percentage_available_length).toBeGreaterThanOrEqual(0)
    expect(metrics.percentage_available_length).toBeLessThanOrEqual(1)
    expect(metrics.percentage_available_height).toBeGreaterThanOrEqual(0)
    expect(metrics.percentage_available_height).toBeLessThanOrEqual(1)
    expect(metrics.percentage_available_depth).toBeGreaterThanOrEqual(0)
    expect(metrics.percentage_available_depth).toBeLessThanOrEqual(1)
    expect(metrics.percentage_available_weight).toBeGreaterThanOrEqual(0)
    expect(metrics.percentage_available_weight).toBeLessThanOrEqual(1)
  })
})
