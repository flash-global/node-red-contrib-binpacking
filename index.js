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
          const binWidth = binInst.getWidth()
          const binHeight = binInst.getHeight()
          const binDepth = binInst.getDepth()
          const binVolume = binInst.getVolume()
          const maxWeight = binInst.getMaxWeight()

          let usedX = 0
          let usedY = 0
          let usedZ = 0
          let usedVolume = 0
          if (binInst.items && binInst.items.length > 0) {
            for (let i = 0; i < binInst.items.length; i++) {
              const it = binInst.items[i]
              const dim = it.getDimension()
              const pos = it.position
              const extentX = (pos && pos[0] ? pos[0] : 0) + dim[0]
              const extentY = (pos && pos[1] ? pos[1] : 0) + dim[1]
              const extentZ = (pos && pos[2] ? pos[2] : 0) + dim[2]
              if (extentX > usedX) usedX = extentX
              if (extentY > usedY) usedY = extentY
              if (extentZ > usedZ) usedZ = extentZ
              usedVolume += it.getVolume()
            }
          }

          const availableWidth = Math.max(0, binWidth - usedX)
          const availableHeight = Math.max(0, binHeight - usedY)
          const availableDepth = Math.max(0, binDepth - usedZ)
          const availableVolume = Math.max(0, binVolume - usedVolume)
          const availableWeight = Math.max(0, maxWeight - binInst.getPackedWeight())

          const round2 = (v) => Number(v.toFixed(2))

          const metrics = {
            available_volume: availableVolume,
            available_length: availableDepth,
            available_height: availableHeight,
            available_depth: availableWidth,
            available_weight: availableWeight,
            percentage_available_volume: round2(binVolume > 0 ? (availableVolume / binVolume) : 0),
            percentage_available_length: round2(binDepth > 0 ? (availableDepth / binDepth) : 0),
            percentage_available_height: round2(binHeight > 0 ? (availableHeight / binHeight) : 0),
            percentage_available_depth: round2(binWidth > 0 ? (availableWidth / binWidth) : 0),
            percentage_available_weight: round2(maxWeight > 0 ? (availableWeight / maxWeight) : 0)
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
