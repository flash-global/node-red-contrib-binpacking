
const bin = (w, h, l, wt, name) => ({ name, width: w, height: h, length: l, weight: wt })
const pkg = (w, h, l, wt, opts = {}) => ({
  width: w, height: h, length: l, weight: wt,
  quantity: opts.qty || 1,
  stackable: opts.stack || '4',
  allowedRotation: opts.rot || [0],
  ...(opts.name ? { name: opts.name } : {})
})

// --- Fit / no-fit basics ---------------------------------------------------
const fitCases = [
  {
    desc: 'small package fits in bin',
    input: {
      bins: [bin(100, 100, 100, 500, 'box')],
      packages: [pkg(50, 50, 50, 10)]
    },
    exp: { success: true, countok: 1 }
  },
  {
    desc: 'package too large (volume)',
    input: {
      bins: [bin(10, 10, 10, 500, 'tiny')],
      packages: [pkg(50, 50, 50, 5)]
    },
    exp: { success: false, countok: 0 }
  },
  {
    desc: 'package too heavy',
    input: {
      bins: [bin(200, 200, 200, 5, 'light')],
      packages: [pkg(10, 10, 10, 100)]
    },
    exp: { success: false, countok: 0 }
  }
]

// --- Stackable levels ------------------------------------------------------
const stackableCases = [
  {
    desc: 'stackable "no" raises height to bin height',
    input: {
      bins: [bin(100, 100, 120, 400, 'bin')],
      packages: [pkg(60, 60, 70, 28, { stack: 'no' })]
    },
    // height 60 -> 100, volume = 60*100*70 = 420000
    exp: {
      success: true, countok: 1,
      metrics: { usedVolume: 420000, totalVolume: 1200000, availableVolume: 780000, usedWeight: 28, totalWeight: 400, availableWeight: 372 }
    }
  },
  {
    desc: 'stackable "2" raises height to floor(bin.height/2)',
    input: {
      bins: [bin(200, 200, 200, 1000, 'bin')],
      packages: [pkg(50, 10, 50, 20, { stack: '2' })]
    },
    // height 10 -> 100, volume = 50*100*50 = 250000
    exp: { success: true, countok: 1, metrics: { usedVolume: 250000 } }
  },
  {
    desc: 'stackable "3" raises height to floor(bin.height/3)',
    input: {
      bins: [bin(300, 300, 300, 5000, 'bin')],
      packages: [pkg(50, 10, 50, 20, { stack: '3' })]
    },
    // height 10 -> 100, volume = 50*100*50 = 250000
    exp: { success: true, countok: 1, metrics: { usedVolume: 250000 } }
  },
  {
    desc: 'stackable "4" raises height to floor(bin.height/4)',
    input: {
      bins: [bin(400, 400, 400, 10000, 'bin')],
      packages: [pkg(50, 10, 50, 20, { stack: '4' })]
    },
    // height 10 -> 100, volume = 50*100*50 = 250000
    exp: { success: true, countok: 1, metrics: { usedVolume: 250000 } }
  },
  {
    desc: 'stackable "4" keeps height when already taller than bin/4',
    input: {
      bins: [bin(400, 400, 400, 10000, 'bin')],
      packages: [pkg(50, 150, 50, 20, { stack: '4' })]
    },
    // height stays 150 (> 100), volume = 50*150*50 = 375000
    exp: { success: true, countok: 1, metrics: { usedVolume: 375000 } }
  },
  {
    desc: 'stackable "no" with non-standard bin height (95)',
    input: {
      bins: [bin(80, 95, 120, 350, 'break')],
      packages: [pkg(30, 30, 30, 5, { stack: 'no', rot: [0, 3] })]
    },
    exp: { success: true, countok: 1, metrics: { usedVolume: 85500, totalVolume: 912000, availableVolume: 826500, usedWeight: 5, totalWeight: 350, availableWeight: 345 } }
  },
]

// --- Quantity handling ------------------------------------------------------
const quantityCases = [
  {
    desc: 'qty 2 — both fit in large bin',
    input: {
      bins: [bin(200, 200, 200, 5000, 'bin')],
      packages: [pkg(50, 50, 50, 10, { qty: 2, rot: [0, 1, 2, 3, 4, 5] })]
    },
    exp: { success: true, countok: 1, metrics: { usedWeight: 20 } }
  },
  {
    desc: 'qty 2 — only 1 fits (stackable "no" fills height)',
    input: {
      bins: [bin(100, 100, 120, 400, 'bin')],
      packages: [pkg(60, 60, 70, 28, { qty: 2, stack: 'no' })]
    },
    exp: { success: false, countok: 0, metrics: { usedWeight: 28 } }
  },
  {
    desc: 'qty 3 — all fit with restricted rotation',
    input: {
      bins: [bin(130, 170, 360, 1200, 'bin')],
      packages: [pkg(82, 94, 120, 120, { qty: 3, rot: [0, 3] })]
    },
    exp: { success: true, countok: 1, metrics: { usedWeight: 360, totalWeight: 1200, availableWeight: 840 } }
  },
  {
    desc: 'qty 3 — none fit in small bin',
    input: {
      bins: [bin(100, 100, 150, 400, 'bin')],
      packages: [pkg(82, 94, 120, 120, { qty: 3, rot: [0, 3] })]
    },
    exp: { success: false, countok: 0 }
  },
  {
    desc: 'qty 8 — stackable "4" all fit',
    input: {
      bins: [bin(130, 170, 330, 1200, 'frg2')],
      packages: [pkg(80, 100, 60, 50, { qty: 8, rot: [0, 3] })]
    },
    exp: { success: true, countok: 1, metrics: { usedWeight: 400, totalWeight: 1200, availableWeight: 800 } }
  },
  {
    desc: 'qty 32 (2 types x16) — multi-package-type',
    input: {
      bins: [bin(245, 310, 1360, 25000, 'semim')],
      packages: [
        pkg(120, 150, 160, 300, { qty: 16, rot: [0, 3] }),
        pkg(120, 150, 160, 300, { qty: 16, rot: [0, 3] })
      ]
    },
    exp: { success: true, countok: 1, metrics: { usedWeight: 9600, totalWeight: 25000, availableWeight: 15400 } }
  },
  {
    desc: 'qty 12 — near weight limit (960/1000kg)',
    input: {
      bins: [bin(200, 200, 400, 1000, 'frg4')],
      packages: [pkg(120, 95, 100, 80, { qty: 12, rot: [0, 3] })]
    },
    exp: { success: true, countok: 1, metrics: { usedWeight: 960, totalWeight: 1000, availableWeight: 40 } }
  },
]

// --- Default values --------------------------------------------------------
const defaultsCases = [
  {
    desc: 'missing name uses defaults ("vehicle"/"Item")',
    input: {
      bins: [{ width: 100, height: 100, length: 100, weight: 500 }],
      packages: [pkg(50, 50, 50, 10)]
    },
    exp: { success: true, countok: 1 }
  },
  {
    desc: 'missing quantity defaults to 1',
    input: {
      bins: [bin(100, 100, 100, 500, 'b')],
      packages: [{ name: 'p', width: 50, height: 50, length: 50, weight: 10, stackable: '4', allowedRotation: [0] }]
    },
    exp: { success: true, countok: 1 }
  },
  {
    desc: 'missing stackable defaults to "1" (height raised)',
    input: {
      bins: [bin(100, 100, 100, 500, 'b')],
      packages: [{ name: 'p', width: 50, height: 30, length: 50, weight: 10, quantity: 1, allowedRotation: [0] }]
    },
    // height 30 -> 100, volume = 50*100*50 = 250000
    exp: { success: true, countok: 1, metrics: { usedVolume: 250000 } }
  },
  {
    desc: 'missing allowedRotation defaults to all [0..5]',
    input: {
      bins: [bin(100, 100, 100, 500, 'b')],
      packages: [{ name: 'p', width: 50, height: 50, length: 50, weight: 10, quantity: 1, stackable: '4' }]
    },
    exp: { success: true, countok: 1 }
  }
]

// --- Multiple bins ---------------------------------------------------------
const multiBinCases = [
  {
    desc: 'first bin too small, second fits',
    input: {
      bins: [
        bin(10, 10, 10, 500, 'tiny'),
        bin(200, 200, 200, 5000, 'big')
      ],
      packages: [pkg(50, 50, 50, 10)]
    },
    exp: { resultLength: 2, perBin: [false, true], countok: 1 }
  },
  {
    desc: 'both bins fit — countok reflects total',
    input: {
      bins: [
        bin(200, 200, 200, 5000, 'a'),
        bin(200, 200, 200, 5000, 'b')
      ],
      packages: [pkg(50, 50, 50, 10)]
    },
    exp: { resultLength: 2, perBin: [true, true], countok: 2 }
  },
  {
    desc: 'all bins too small — countok 0 (no solution)',
    input: {
      bins: [
        bin(10, 10, 10, 500, 'a'),
        bin(10, 10, 10, 500, 'b')
      ],
      packages: [pkg(50, 50, 50, 10)]
    },
    exp: { resultLength: 2, perBin: [false, false], countok: 0 }
  }
]

// --- Metrics exact match ---------------------------------------------------
const metricsCases = [
  {
    desc: 'exact-fit item — all metrics correct',
    input: {
      bins: [bin(100, 100, 100, 500, 'bin')],
      packages: [pkg(100, 100, 100, 50)]
    },
    exp: {
      success: true, countok: 1,
      metrics: { usedVolume: 1000000, totalVolume: 1000000, availableVolume: 0, usedWeight: 50, totalWeight: 500, availableWeight: 450 }
    }
  }
]

// --- Rotation retry --------------------------------------------------------
const rotationRetryCases = [
  {
    desc: 'retries single rotations when multi-rotation fails',
    input: {
      bins: [bin(50, 50, 200, 5000, 'tight')],
      packages: [pkg(10, 10, 180, 5, { rot: [0, 1, 2, 3, 4, 5] })]
    },
    exp: { success: true, countok: 1 }
  },
  {
    // single item "no" with full metrics
    desc: 'stackable "no" — 1x 80x60x120 in break (100x100x130)',
    input: {
      bins: [bin(100, 100, 130, 400, 'break')],
      packages: [pkg(80, 60, 120, 278, { stack: 'no', rot: [0, 3] })]
    },
    exp: { success: true, countok: 1, metrics: { usedVolume: 960000, totalVolume: 1300000, availableVolume: 340000, usedWeight: 278, totalWeight: 400, availableWeight: 122 } }
  },
  {
    // 8x heavy non-stackable
    desc: 'stackable "no" — 8x heavy items (380kg each) in large bin',
    input: {
      bins: [bin(245, 245, 700, 5000, 'pl5')],
      packages: [pkg(120, 76, 140, 380, { qty: 8, stack: 'no', rot: [0, 3] })]
    },
    exp: { success: true, countok: 1, metrics: { usedWeight: 3040, totalWeight: 5000, availableWeight: 1960 } }
  },
  {
    // 5x non-stackable in frg4
    desc: 'stackable "no" — 5x 100x110x120 in frg4 (200x200x400)',
    input: {
      bins: [bin(200, 200, 400, 1000, 'frg4')],
      packages: [pkg(100, 110, 120, 130, { qty: 5, stack: 'no', rot: [0, 3] })]
    },
    exp: { success: true, countok: 1, metrics: { usedWeight: 650, totalWeight: 1000, availableWeight: 350 } }
  },
  {
    // 6x non-stackable in frg4
    desc: 'stackable "no" — 6x 100x115x120 in frg4 (200x200x400)',
    input: {
      bins: [bin(200, 200, 400, 1000, 'frg4')],
      packages: [pkg(100, 115, 120, 125, { qty: 6, stack: 'no', rot: [0, 3] })]
    },
    exp: { success: true, countok: 1, metrics: { usedWeight: 750, totalWeight: 1000, availableWeight: 250 } }
  },
  {
    // 4x non-stackable in frg1
    desc: 'stackable "no" — 4x 60x95x80 in frg1 (120x125x200)',
    input: {
      bins: [bin(120, 125, 200, 800, 'frg1')],
      packages: [pkg(60, 95, 80, 65, { qty: 4, stack: 'no', rot: [0, 3] })]
    },
    exp: { success: true, countok: 1, metrics: { usedWeight: 260, totalWeight: 800, availableWeight: 540 } }
  }
]

// --- Invalid bin field combinations ----------------------------------------
const invalidBinCases = [
  {
    desc: 'invalid bin — missing width',
    input: {
      bins: [{ name: 'b', height: 100, length: 100, weight: 500 }],
      packages: [pkg(10, 10, 10, 5)]
    },
    exp: { hasResult: false }
  },
  {
    desc: 'invalid bin — missing height',
    input: {
      bins: [{ name: 'b', width: 100, length: 100, weight: 500 }],
      packages: [pkg(10, 10, 10, 5)]
    },
    exp: { hasResult: false }
  },
  {
    desc: 'invalid bin — missing length',
    input: {
      bins: [{ name: 'b', width: 100, height: 100, weight: 500 }],
      packages: [pkg(10, 10, 10, 5)]
    },
    exp: { hasResult: false }
  },
  {
    desc: 'invalid bin — missing weight',
    input: {
      bins: [{ name: 'b', width: 100, height: 100, length: 100 }],
      packages: [pkg(10, 10, 10, 5)]
    },
    exp: { hasResult: false }
  },
  {
    desc: 'mixed valid + invalid bins — only valid bin produces result',
    input: {
      bins: [
        { name: 'bad', height: 100, length: 100, weight: 500 }, // missing width
        bin(200, 200, 200, 5000, 'good')
      ],
      packages: [pkg(50, 50, 50, 10)]
    },
    // The invalid bin triggers BinPackingError but the valid bin still gets packed
    exp: { hasResult: true, countok: 1 }
  }
]

// --- Invalid package field combinations ------------------------------------
const invalidPackageCases = [
  {
    desc: 'invalid package — missing width',
    input: {
      bins: [bin(100, 100, 100, 500, 'b')],
      packages: [{ name: 'p', height: 10, length: 10, weight: 5, quantity: 1 }]
    },
    exp: { hasResult: false }
  },
  {
    desc: 'invalid package — missing height',
    input: {
      bins: [bin(100, 100, 100, 500, 'b')],
      packages: [{ name: 'p', width: 10, length: 10, weight: 5, quantity: 1 }]
    },
    exp: { hasResult: false }
  },
  {
    desc: 'invalid package — missing length',
    input: {
      bins: [bin(100, 100, 100, 500, 'b')],
      packages: [{ name: 'p', width: 10, height: 10, weight: 5, quantity: 1 }]
    },
    exp: { hasResult: false }
  },
  {
    desc: 'invalid package — missing weight',
    input: {
      bins: [bin(100, 100, 100, 500, 'b')],
      packages: [{ name: 'p', width: 10, height: 10, length: 10, quantity: 1 }]
    },
    exp: { hasResult: false }
  },
  {
    desc: 'mixed valid + invalid packages — valid one still packed',
    input: {
      bins: [bin(200, 200, 200, 5000, 'b')],
      packages: [
        { name: 'bad', height: 10, length: 10, weight: 5, quantity: 1 }, // missing width
        pkg(50, 50, 50, 10)
      ]
    },
    // invalid package triggers error, but valid one is still packed
    exp: { hasResult: true, countok: 1 }
  }
]

// --- Rotation retry edge cases ---------------------------------------------
const rotationRetryEdgeCases = [
  {
    desc: 'rotation retry — first attempt succeeds, no retry needed',
    input: {
      bins: [bin(200, 200, 200, 5000, 'big')],
      packages: [pkg(50, 50, 50, 10, { rot: [0, 1, 2] })]
    },
    exp: { success: true, countok: 1, solvedRotation: null }
  }
]

// --- Unrecognized stackable value ------------------------------------------
const unknownStackableCases = [
  {
    desc: 'stackable "5" (unrecognized) — height unchanged',
    input: {
      bins: [bin(200, 200, 200, 5000, 'bin')],
      packages: [pkg(50, 10, 50, 20, { stack: '5' })]
    },
    // No stackable branch matches "5", so height stays at 10
    // volume = 50*10*50 = 25000
    exp: { success: true, countok: 1, metrics: { usedVolume: 25000 } }
  }
]

// --- Quantity zero edge case -----------------------------------------------
const quantityZeroCases = [
  {
    desc: 'quantity 0 produces zero items — packing has no packages',
    input: {
      bins: [bin(100, 100, 100, 500, 'b')],
      packages: [{ name: 'ghost', width: 50, height: 50, length: 50, weight: 10, quantity: 0, stackable: '4', allowedRotation: [0] }]
    },
    // quantity 0 means the inner loop runs 0 times → no items → no packing happens
    exp: { hasResult: false }
  }
]

// --- Error handling --------------------------------------------------------
const errorCases = [
  {
    desc: 'missing bins',
    input: { packages: [pkg(10, 10, 10, 5)] },
    exp: { hasResult: false }
  },
  {
    desc: 'empty bins',
    input: { bins: [], packages: [pkg(10, 10, 10, 5)] },
    exp: { hasResult: false }
  },
  {
    desc: 'missing packages',
    input: { bins: [bin(100, 100, 100, 500, 'b')] },
    exp: { hasResult: false }
  },
  {
    desc: 'empty packages',
    input: { bins: [bin(100, 100, 100, 500, 'b')], packages: [] },
    exp: { hasResult: false }
  }
]

module.exports = {
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
  unknownStackableCases,
  quantityZeroCases
}
