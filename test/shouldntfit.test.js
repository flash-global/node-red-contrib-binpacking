const request = require('supertest')
const hostDemo = 'http://localhost:1880/binpacking'

const data = {
  bins: [
    {
      name: 'frg4',
      length: 400,
      width: 200,
      height: 200,
      weight: 1000
    }
  ],
  packages: [
    {
      type: 'pallet',
      quantity: 8,
      length: 120,
      width: 80,
      height: 45,
      weight: 55,
      stackable: '4',
      allowedRotation: [
        0, 2
      ]
    },
    {
      quantity: 5,
      length: 120,
      width: 80,
      height: 100,
      weight: 55,
      type: 'pallet',
      stackable: '4',
      allowedRotation: [
        0,
        2
      ]
    },
    {
      quantity: 5,
      length: 120,
      width: 80,
      height: 100,
      weight: 55,
      type: 'pallet',
      stackable: '4',
      allowedRotation: [
        0,
        2
      ]
    }
  ]
}

describe('Test related to binpacking', () => {
  test('Package should not fit', async () => {
    const response = await request(`${hostDemo}`).post('/').send(data)

    expect(response.body.result[0].success).toBe(false)
  })
})
