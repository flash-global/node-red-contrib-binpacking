module.exports = function (RED) {
  function BinPackingError (node, msg) {
    node.status({
      fill: 'red',
      shape: 'ring',
      text: msg
    })
    node.error(msg)
  }

  function checkStackable (bin, packages) {
    const adaptedPackages = []

    packages.forEach((pkg) => {
      const { item, stackable } = pkg

      if (item.originale_height) {
        item.height = item.originale_height
      } else {
        item.originale_height = item.height
      }

      if (stackable === 'no' || stackable === '1') {
        if (item.height < bin.height) {
          item.height = bin.height
        }
      } else if (stackable === '2') {
        const minHeight = Math.floor(bin.height / 2)
        if (item.height < minHeight) {
          item.height = minHeight
        }
      } else if (stackable === '3') {
        const minHeight = Math.floor(bin.height / 3)
        if (item.height < minHeight) {
          item.height = minHeight
        }
      } else if (stackable === '4') {
        const minHeight = Math.floor(bin.height / 4)
        if (item.height < minHeight) {
          item.height = minHeight
        }
      }

      adaptedPackages.push(item)
    })

    return adaptedPackages
  }

  // Convert scaled BP3D volumes (dims scaled by 1e5 ⇒ volume scaled by 1e15)
  const VOLUME_SCALE = 1e15
  function toUnitsVolume (v) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      return 0
    }
    const unscaled = v / VOLUME_SCALE
    if (!Number.isFinite(unscaled)) {
      return 0
    }
    // Round to 3 decimals to preserve small volumes (e.g., 0.003)
    const rounded = Number(unscaled.toFixed(3))
    return rounded > 0 ? rounded : 0
  }

  // Convert scaled BP3D weights (weights scaled by 1e5)
  const WEIGHT_SCALE = 1e5
  function toUnitsWeight (v) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      return 0
    }
    const unscaled = v / WEIGHT_SCALE
    if (!Number.isFinite(unscaled)) {
      return 0
    }
    const rounded = Number(unscaled.toFixed(2))
    return rounded > 0 ? rounded : 0
  }

  function BinPackingNode (config) {
    RED.nodes.createNode(this, config)
    const node = this
    node.on('input', function (msg) {
      const {
        Item,
        Bin,
        Packer
      } = require('binpackingjs').BP3D
      msg.payload = {}
      msg.payload.result = []

      // Bins Setup
      const bins = []
      if (msg.bins && msg.bins.length > 0) {
        for (const bin in msg.bins) {
          if (msg.bins[bin].width && msg.bins[bin].height && msg.bins[bin].length && msg.bins[bin].weight) {
            if (!msg.bins[bin].name) msg.bins[bin].name = 'vehicle'
            bins.push(new Bin(msg.bins[bin].name + ' ' + bin, parseInt(msg.bins[bin].width),
              parseInt(msg.bins[bin].height), parseInt(msg.bins[bin].length), parseInt(msg.bins[bin].weight)))
          } else BinPackingError(this, 'invalid msg.bins')
        }
      } else BinPackingError(this, 'missing msg.bins')

      // Packages Setup
      const packages = []
      if (msg.packages && msg.packages.length > 0) {
        for (const pkg in msg.packages) {
          if (!msg.packages[pkg].quantity) msg.packages[pkg].quantity = 1
          if (typeof msg.packages[pkg].stackable === 'undefined') {
            msg.packages[pkg].stackable = '1'
          }
          if (msg.packages[pkg].width && msg.packages[pkg].height && msg.packages[pkg].length && msg.packages[pkg].weight) {
            for (let q = 0; q < msg.packages[pkg].quantity; q++) {
              if (!msg.packages[pkg].name) msg.packages[pkg].name = 'Item'
              if (!msg.packages[pkg].allowedRotation) msg.packages[pkg].allowedRotation = [0, 1, 2, 3, 4, 5]

              packages.push(
                {
                  item: new Item(
                    msg.packages[pkg].name + ' ' + q, msg.packages[pkg].width,
                    msg.packages[pkg].height, msg.packages[pkg].length,
                    msg.packages[pkg].weight, msg.packages[pkg].allowedRotation
                  ),
                  stackable: msg.packages[pkg].stackable
                }
              )
            }
          } else BinPackingError(this, 'invalid msg.packages')
        }
      } else BinPackingError(this, 'missing msg.packages')

      // Helper: build a fresh packer with new Bin/Item objects for a given bin index
      function buildAndPack (binIdx, rotationOverride) {
        const b = msg.bins[binIdx]
        const bin = new Bin(
          (b.name || 'vehicle') + ' ' + binIdx,
          parseInt(b.width), parseInt(b.height),
          parseInt(b.length), parseInt(b.weight)
        )
        const pkgs = []
        for (const p in msg.packages) {
          const mp = msg.packages[p]
          const qty = mp.quantity || 1
          const stackable = typeof mp.stackable === 'undefined' ? '1' : mp.stackable
          const rotation = rotationOverride || mp.allowedRotation || [0, 1, 2, 3, 4, 5]
          for (let q = 0; q < qty; q++) {
            pkgs.push({
              item: new Item(
                (mp.name || 'Item') + ' ' + q,
                mp.width, mp.height, mp.length, mp.weight,
                rotation
              ),
              stackable: stackable
            })
          }
        }
        const packer = new Packer()
        packer.addBin(bin)
        packer.items.push(...checkStackable(bin, pkgs))
        packer.pack()
        return packer
      }

      if ((bins.length > 0) && (packages.length > 0)) {
        let binpackingsolution = 0
        for (let b = 0; b < bins.length; b++) {
          // First attempt: use original allowedRotation as provided
          let finalPacker = buildAndPack(b, null)
          let solvedRotation = null

          // Retry with each single rotation if first attempt failed
          if (finalPacker.unfitItems.length > 0) {
            const allRotations = new Set()
            for (const p of msg.packages) {
              const rot = p.allowedRotation || [0, 1, 2, 3, 4, 5]
              rot.forEach(r => allRotations.add(r))
            }
            if (allRotations.size > 1) {
              for (const singleRot of allRotations) {
                const retryPacker = buildAndPack(b, [singleRot])
                if (retryPacker.unfitItems.length === 0) {
                  finalPacker = retryPacker
                  solvedRotation = singleRot
                  break
                }
              }
            }
          }

          msg.payload.result[b] = {}

          // Compute metrics using the best packer result
          const binInst = finalPacker.bins[0]
          const binVolume = binInst.getVolume()
          const maxWeight = binInst.getMaxWeight()

          // sum the total item's volumes (post-stackability) in scaled units
          const usedVolumeScaled = binInst.items.reduce((total, item) => total + item.getVolume(), 0)

          const metrics = {
            // it retuns same unit as the input; example: if input is cm, it returns cm3
            usedVolume: toUnitsVolume(usedVolumeScaled),
            totalVolume: toUnitsVolume(binVolume),
            availableVolume: toUnitsVolume(binVolume - usedVolumeScaled),
            // it retuns same unit as the input; example: if input is kg, it returns kg
            usedWeight: toUnitsWeight(binInst.getPackedWeight()),
            totalWeight: toUnitsWeight(maxWeight),
            availableWeight: toUnitsWeight(maxWeight) - toUnitsWeight(binInst.getPackedWeight())
          }

          msg.payload.result[b].metrics = metrics
          msg.payload.result[b].bin = JSON.parse(JSON.stringify(finalPacker.bins[0]))
          msg.payload.result[b].success = false
          if (finalPacker.unfitItems.length === 0) {
            msg.payload.result[b].success = true
            msg.payload.result[b].solvedRotation = solvedRotation
            binpackingsolution++
          }
        }
        msg.payload.countok = binpackingsolution
        if (binpackingsolution === 0) {
          this.status({
            fill: 'yellow',
            shape: 'ring',
            text: 'no solution'
          })
        } else {
          this.status({
            fill: 'green',
            shape: 'ring',
            text: binpackingsolution + ' solution(s)'
          })
        }
      }
      node.send(msg)
    })
  }

  RED.nodes.registerType('binpacking', BinPackingNode)
}
