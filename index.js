module.exports = function(RED) {
  function BinPackingNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.on('input', function(msg) {
      const result = [];
      const {
        Item,
        Bin,
        Packer
      } = require('binpackingjs').BP3D;
      const bins = [
        new Bin("break", 100, 100, 120, 400),
        new Bin("frg1", 120, 120, 240, 800),
        new Bin("frg2", 120, 150, 320, 1200),
        new Bin("frg3", 120, 150, 420, 1200),
        new Bin("frg4", 200, 200, 200, 1000),
        new Bin("pl5", 240, 270, 600, 3000),
        new Bin("pl9", 240, 270, 750, 7500),
        new Bin("semi", 240, 270, 1360, 24000)
      ];
      msg.vehicle = [];
      let machins = [];
      msg.payload.forEach((row) => {
        let k = 0;
        for (var j = 0; j < row.quantity; j++) {
          machins.push(new Item("Item " + k, row.width, row.height, row.length, row.weight));
          k++;
        }
      });
      let found = false;
      bins.forEach((bin, index) => {
        if (!found) {
          msg.payload = index;
          const packer = new Packer();
          packer.addBin(bin);
          packer.items.push(...machins);
          packer.pack();
          if (packer.unfitItems.length === 0) {
            found = true;
            if (index > 0) {
              msg.vehicle[0] = bins[index - 1];
            }
            msg.vehicle[1] = bins[index];
            if (index <= bins.length) {
              msg.vehicle[2] = bins[index + 1];
            }
          }
        }
      });
      node.send(msg);
    });
  }
  RED.nodes.registerType("binpacking", BinPackingNode);
}
