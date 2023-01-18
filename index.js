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
      if (pkg.stackable === 'no' && pkg.item.height < bin.height) {
        pkg.item.height = bin.height
      }
      adaptedPackages.push(pkg.item)
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
              if (msg.packages[pkg].type === 'pallet') msg.packages[pkg].allowedRotation = [0, 3]
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
