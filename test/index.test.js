const request = require('supertest')
const hostDemo = 'http://localhost:1880/binpacking'
const {
  fitCases,
  stackableCases,
  quantityCases,
  defaultsCases,
  multiBinCases,
  metricsCases,
  rotationRetryCases,
  errorCases,
  invalidBinCases,
  invalidPackageCases,
  rotationRetryEdgeCases,
  unknownStackableCases
} = require('./index.test.data')

const post = (data) => request(hostDemo).post('/').send(data)

describe('Fit / no-fit basics', () => {
  fitCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      expect(res.body.result[0].success).toBe(exp.success)
      if (exp.countok !== undefined) expect(res.body.countok).toBe(exp.countok)
    })
  })
})

describe('Stackable levels', () => {
  stackableCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      expect(res.body.result[0].success).toBe(exp.success)
      if (exp.metrics) {
        Object.entries(exp.metrics).forEach(([key, val]) => {
          expect(res.body.result[0].metrics[key]).toBe(val)
        })
      }
    })
  })
})

describe('Quantity handling', () => {
  quantityCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      expect(res.body.result[0].success).toBe(exp.success)
      if (exp.countok !== undefined) expect(res.body.countok).toBe(exp.countok)
      if (exp.metrics) {
        Object.entries(exp.metrics).forEach(([key, val]) => {
          expect(res.body.result[0].metrics[key]).toBe(val)
        })
      }
    })
  })
})

describe('Default values', () => {
  defaultsCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      expect(res.body.result[0].success).toBe(exp.success)
      if (exp.countok !== undefined) expect(res.body.countok).toBe(exp.countok)
      if (exp.metrics) {
        Object.entries(exp.metrics).forEach(([key, val]) => {
          expect(res.body.result[0].metrics[key]).toBe(val)
        })
      }
    })
  })
})

describe('Multiple bins', () => {
  multiBinCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      expect(res.body.result).toHaveLength(exp.resultLength)
      exp.perBin.forEach((expectedSuccess, i) => {
        expect(res.body.result[i].success).toBe(expectedSuccess)
      })
      expect(res.body.countok).toBe(exp.countok)
    })
  })
})

describe('Metrics accuracy', () => {
  metricsCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      expect(res.body.result[0].success).toBe(exp.success)
      expect(res.body.result[0].metrics).toEqual(exp.metrics)
    })
  })
})

describe('Rotation retry', () => {
  rotationRetryCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      expect(res.body.result[0].success).toBe(exp.success)
      if (exp.solvedRotation !== undefined) {
        expect(res.body.result[0].solvedRotation).toBe(exp.solvedRotation)
      }
      if (exp.countok !== undefined) expect(res.body.countok).toBe(exp.countok)
      if (exp.metrics) {
        Object.entries(exp.metrics).forEach(([key, val]) => {
          expect(res.body.result[0].metrics[key]).toBe(val)
        })
      }
    })
  })
})

describe('Error handling', () => {
  errorCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      if (exp.hasResult === false) {
        expect(res.body.countok).toBeUndefined()
      }
    })
  })
})

describe('Invalid bin fields', () => {
  invalidBinCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      if (exp.hasResult === false) {
        expect(res.body.countok).toBeUndefined()
      }
      if (exp.countok !== undefined) {
        expect(res.body.countok).toBe(exp.countok)
      }
    })
  })
})

describe('Invalid package fields', () => {
  invalidPackageCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      if (exp.hasResult === false) {
        expect(res.body.countok).toBeUndefined()
      }
      if (exp.countok !== undefined) {
        expect(res.body.countok).toBe(exp.countok)
      }
    })
  })
})

describe('Rotation retry edge cases', () => {
  rotationRetryEdgeCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      expect(res.body.result[0].success).toBe(exp.success)
      if (exp.countok !== undefined) expect(res.body.countok).toBe(exp.countok)
      if (exp.solvedRotation !== undefined) {
        expect(res.body.result[0].solvedRotation).toBe(exp.solvedRotation)
      }
    })
  })
})

describe('Unrecognized stackable values', () => {
  unknownStackableCases.forEach(({ desc, input, exp }) => {
    test(desc, async () => {
      const res = await post(input)
      expect(res.body.result[0].success).toBe(exp.success)
      if (exp.countok !== undefined) expect(res.body.countok).toBe(exp.countok)
      if (exp.metrics) {
        Object.entries(exp.metrics).forEach(([key, val]) => {
          expect(res.body.result[0].metrics[key]).toBe(val)
        })
      }
    })
  })
})


