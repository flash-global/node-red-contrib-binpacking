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
  })

  test('If stackable no and bin height > item height and have 2 quantity', async () => {
    data.packages[0].quantity = 2
    const response = await request(`${hostDemo}`).post('/').send(data)
    expect(response.body.result[0].success).toBe(false)
  })
})
