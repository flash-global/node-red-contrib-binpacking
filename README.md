# node-red-contrib-binpacking

[![Build Status](https://api.travis-ci.org/lvenier/node-red-contrib-binpacking.svg?branch=master)](https://travis-ci.org/lvenier/node-red-contrib-binpacking)
[![npm version](http://img.shields.io/npm/v/node-red-contrib-binpacking.svg?style=flat)](https://npmjs.org/package/node-red-contrib-binpacking "View this project on npm")
[![Github Issues](http://img.shields.io/github/issues/lvenier/node-red-contrib-binpacking)](https://github.com/lvenier/node-red-contrib-binpacking/issues)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

node-red-contrib-binpacking is based on the binpackingjs (https://github.com/olragon/binpackingjs) library.

It only supports 3D packing and is primarly designed for logistics purpose.

## Input / Output

### inputs :

- A vehicle list called "bins". You must provide a msg.payload.bins as a json array.
- A parcel or package list you want to transport. You must provide a msg.payload.packages a a json array

### output :

- The list of vehicle type with a success true or false ( { "success" : true}). true means the package can fit in the vehicle and false it means it can not. The result is available in the msg.payload.binpacking and the vehicle list order is kept. For each vehicle type the palette also provide which package can fit if they can all be in the vehicle.

## Test

You can check the flow in the sample directory to have a better understanding of the input and output.
It provides 2 examples :
- timestamp with predefined set of data
- api get/post to input values

## Demo

UI : 
https://binpacking.yoctu.com/ui

API : 
```curl -X POST https://binpacking.yoctu.com/api/ -H 'Content-type: application/json' -d '{ "packages": [ { "name": "bh", "width": 50, "height": 60, "length": 70, "weight": 28, "quantity": 3 } ], "bins": [ { "name": "brokenvolvo", "width": 100, "height": 100, "length": 120, "weight": 400 } ] }'```

## Contributors and Thanks

Thank you

@olragon for the binpackingjs library

@fanshan for the feedback on the palette

@misterbh for the first version

@zainiro for using it

LaV.
