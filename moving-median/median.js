/*
The MIT License (MIT)

Copyright (c) 2013 Mikola Lysenko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

function createMedianFilter(length) {
  var buffer   = new Float64Array(length)
  var history  = new Int32Array(length)
  var counter  = 0
  var bufCount = 0
  function insertItem(x) {
    var nextCounter = counter++
    var oldCounter  = nextCounter - length

    //First pass:  Remove all old items
    var ptr = 0
    for(var i=0; i<bufCount; ++i) {
      var c = history[i]
      if(c <= oldCounter) {
        continue
      }
      buffer[ptr] = buffer[i]
      history[ptr] = c
      ptr += 1
    }
    bufCount = ptr

    //Second pass:  Insert x
    if(!isNaN(x)) {
      var ptr = bufCount
      for(var j=bufCount-1; j>=0; --j) {
        var y = buffer[j]
        if(y < x) {
          buffer[ptr] = x
          history[ptr] = nextCounter
          break
        }
        buffer[ptr] = y
        history[ptr] = history[j]
        ptr -= 1
      }
      if(j < 0) {
        buffer[0]  = x
        history[0] = nextCounter
      }
      bufCount += 1
    }

    //Return median
    if(!bufCount) {
      return NaN
    } else if(bufCount & 1) {
      return buffer[bufCount>>>1]
    } else {
      var mid = bufCount>>>1
      return 0.5*(buffer[mid-1] + buffer[mid])
    }
  }
  return insertItem
}


// this function applies on array 'arr' moving median with window size = 'windowSize'
function movingMedian(arr, windowSize){

  var res = [];
  var len = arr.length;
  var median = createMedianFilter(windowSize);

  for(var i=0; i<arr.length; ++i)
    res.push(median(arr[i]))

  return res
}