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
      // Track original total volume from input packages (pre-stackable), in scaled units (×1e15)
      let usedVolumeOriginal = 0
      if (msg.packages && msg.packages.length > 0) {
        for (const pkg in msg.packages) {
          if (!msg.packages[pkg].quantity) msg.packages[pkg].quantity = 1
          if (typeof msg.packages[pkg].stackable === 'undefined') {
            msg.packages[pkg].stackable = '1'
          }
          if (msg.packages[pkg].width && msg.packages[pkg].height && msg.packages[pkg].length && msg.packages[pkg].weight) {
            // Accumulate original volume in scaled integer units to match BP3D math
            // (dims × 1e5 ⇒ volume × 1e15), then we scale back via toUnitsVolume
            const quantity = msg.packages[pkg].quantity
            const scaledWidth = Math.round(msg.packages[pkg].width * 1e5)
            const scaledHeight = Math.round(msg.packages[pkg].height * 1e5)
            const scaledDepth = Math.round(msg.packages[pkg].length * 1e5)
            usedVolumeOriginal += (scaledWidth * scaledHeight * scaledDepth) * quantity

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

      if ((bins.length > 0) && (packages.length > 0)) {
        let binpackingsolution = 0
        for (let b = 0; b < bins.length; b++) {
          const packer = new Packer()
          packer.addBin(bins[b])
          packer.items.push(...checkStackable(bins[b], packages))
          packer.pack()
          msg.payload.result[b] = {}

          // Compute metrics
          const binInst = packer.bins[0]
          const binVolume = binInst.getVolume()
          const maxWeight = binInst.getMaxWeight()

          const metrics = {
            // it retuns same unit as the input; example: if input is cm, it returns cm3
            usedVolume: toUnitsVolume(usedVolumeOriginal),
            totalVolume: toUnitsVolume(binVolume),
            availableVolume: toUnitsVolume(binVolume - usedVolumeOriginal),
            // it retuns same unit as the input; example: if input is kg, it returns kg
            usedWeight: toUnitsWeight(binInst.getPackedWeight()),
            totalWeight: toUnitsWeight(maxWeight),
            availableWeight: toUnitsWeight(maxWeight) - toUnitsWeight(binInst.getPackedWeight())
          }

          msg.payload.result[b].metrics = metrics
          msg.payload.result[b].bin = JSON.parse(JSON.stringify(packer.bins[0]))
          msg.payload.result[b].success = false
          if (packer.unfitItems.length === 0) {
            msg.payload.result[b].success = true
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
