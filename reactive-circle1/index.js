//
//  Plotter sounds - midi 1 test
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

// Set these two next lines to the ratio of your design and the prefix you want to use
const ratio = 1 / 1.414 // Canvas ratio (width / height, i.e. 3/4, 16/9, 1/1, 1/1.414 (Ax paper size))
// const prefix = 'plotter_sounds_midi_one' // The filename we use when saving an image

let resizeTmr = null

// This is also optional, and it used if we are animating the design
const animated = true
let nextFrame = null // requestAnimationFrame, and the ability to clear it
let analyser = null
let dataArray = null
let startedCapture = false
const features = {}
let allCircles = []
let saveNextPass = false
const allLines = []
/*
 * This is your setup function, it gets called right at the start, and only once.
 * This is where you make all your decisions about what the design is going to look like.
 * All the random choices should be made here, and the information stored in the features object
 * so that the drawCanvas() function can use it to draw the design.
 *
 * As you want to do more complicated things you'll want to move beyond this simple setup function,
 * but for the moment this is all we need (we'll cover more in a future YouTube video)
 *
 * The features object is global, so you can access it from anywhere in your code.
 */

// We are going to be bad and hold an array of circles in global scope
// so we can do messy recursive stuff with them
// const circles = []

const setup = () => {
  // We want to be able to listen to live incoming audio (we'll listen for it as a virtual
  // device set up with SoundSource and Loopback), we'll then grab the frequencies
  // let's start listening for audio now

}
//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
setup()

const makeCircle = (radiuses) => {
  // We have been given an array of radius lengths, thing of these as spokes on a wheel.
  // We are going to make a circle out of them, by connecting the ends of the spokes
  // to make a closed loop.
  //
  // The radiuses array is an array of numbers, where each number is the radius of a spoke
  // on the wheel. The number of spokes is the same as the number of radiuses in the array.
  //
  // The return value is an array of points, where each point is an array of two numbers,
  // the first number is the x position of the point, and the second number is the y position
  // of the point.
  //
  // The points are in a clockwise direction, starting from the top of the wheel.
  const points = []
  const startAngle = Math.PI * 1.5
  // const timeDiff = new Date().getTime() - startTime
  let currentAngle = startAngle // + (timeDiff / 1000)
  for (let i = 0; i < radiuses.length; i++) {
    const radius = radiuses[i]
    const x = Math.cos(currentAngle) * radius
    const y = Math.sin(currentAngle) * radius
    points.push([x, y])
    currentAngle += (2 * Math.PI) / radiuses.length
  }
  return points
}
const drawCanvas = async () => {
  // Cancel the next animation frame (we don't really need to do this here, but it's good practice,
  // we don't want to end up having multiple animation frames running at the same time)
  window.cancelAnimationFrame(nextFrame)

  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  // Colour in the canvas in a nice background colour
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, w, h)

  // Set us up to make a black line
  ctx.lineWidth = w / 500

  if (startedCapture) {
    analyser.getByteFrequencyData(dataArray)

    // Set the radiuses array to be the w/4 + w/4 * the dataArray value / 256
    // const radiuses = dataArray.map(d => (w / 4) + ((w / 4) * (d / 256)))
    let radiuses = []
    let highestValue = 0
    // Loop through the points in the dataArray
    for (let i = 0; i < dataArray.length / 1.5; i++) {
      const thisVal = ((h / 5) * (dataArray[i] / 160)) + (h / 10)
      if (thisVal > highestValue) highestValue = thisVal
      radiuses.push(thisVal)
    }
    // We want to mirror the radiuses array and stick a reversed copy onto the end
    radiuses = radiuses.concat(radiuses.slice().reverse())
    // make sure all the entries in rediuses are not undefined
    radiuses = radiuses.filter(radius => radius !== undefined)
    if (radiuses.length) {
      allCircles.push(makeCircle(radiuses))
    }
    if (allCircles.length > 120) allCircles.shift()

    // Go through all the points in each circle rotating them by 1 degree
    allCircles = allCircles.map(circle => {
      return circle.map(point => {
        const angle = Math.atan2(point[1], point[0]) - (Math.PI / 180 * 1)
        const radius = (Math.sqrt(point[0] ** 2 + point[1] ** 2)) * 0.99
        return [Math.cos(angle) * radius, Math.sin(angle) * radius]
      })
    })
    // Loop through all the circles
    allLines.length = 0
    for (let c = 0; c < allCircles.length; c++) {
      const percentThrough = c / allCircles.length
      ctx.strokeStyle = `rgba(0, 0, 0, ${percentThrough})`
      ctx.strokeStyle = 'black'
      // Make an array of points
      const points = allCircles[c]
      // Work out how much to offset the x and y position to set the circle in the middle of the canvas
      const xOffset = w / 2
      const yOffset = h / 2

      ctx.beginPath()
      const line = []
      // Move to the first point
      const startX = points[0][0] + xOffset
      const startY = points[0][1] + yOffset
      // console.log(startX)
      ctx.moveTo(startX, startY)
      line.push({
        x: startX / w,
        y: startY / h
      })
      // Loop through the points, and draw a line to the next point
      for (let i = 1; i < points.length; i++) {
        const x = points[i][0] + xOffset
        const y = points[i][1] + yOffset
        ctx.lineTo(x, y)
        line.push({
          x: x / w,
          y: y / h
        })
      }
      // Close the path
      ctx.closePath()
      line.push({
        x: startX / w,
        y: startY / h
      })
      // Stroke the path
      ctx.stroke()
      allLines.push(line)
    }
  }

  if (saveNextPass !== false) {
    await autoDownloadSVG(saveNextPass)
    saveNextPass = false
  }

  // Draw everything again in the next animation frame, if we are animating
  if (animated) {
    nextFrame = window.requestAnimationFrame(drawCanvas)
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//
// Below are common functions that don't need to change, they handle starting
// the project, laying out the canvas, and handling downloading snapshots.
//
// You don't need to touch anything below here, see README.md for more info
//
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/*
 * This is the init function, it gets called when the DOM is ready. This only ever
 * gets called once to set up the event listeners. Then it kicks things off
 * by calling layoutCanvas(), which in turn calls drawCanvas()
 */
const init = async () => {
  // This is an event listener that gets called when the window is resized. We put it into
  // a timeout so it gets called 100ms _after_ the window has stopped resizing. This is
  // to stop it getting called too often _as_ the window is resized.
  window.addEventListener('resize', async () => {
    //  When we resize we need to layout the canvas again for the new size
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(async () => {
      await layoutCanvas()
    }, 100)
  })

  // Handle all the keypresses here
  document.addEventListener('keypress', async (e) => {
    e = e || window.event
    // Save the canvas as a PNG
    if (e.key === '4') saveNextPass = 4
    if (e.key === '5') saveNextPass = 5
    if (e.key === '6') saveNextPass = 6

    // If the e.key is 'c' then we clear out the circles and activeMidiInputs
    if (e.key === 'c') {
      features.circles = {}
      features.activeMidiInputs = {}
    }
  })

  // When the user clicks on the window we can hook up the audio listener
  window.addEventListener('click', async () => {
    //  Now call layout the canvas, which will in turn call drawCanvas()
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    navigator.mediaDevices.enumerateDevices()
      .then(function (devices) {
        devices.forEach(function (device) {
          console.log(device.kind + ': ' + device.label + ' id = ' + device.deviceId)
        })
      })
      .catch(function (err) {
        console.error(err.name + ': ' + err.message)
      })

    navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: '3ec49099b193dcdd9c4f643800740d0ced5f85a1fcc8edc5587731378c7cb724' } }, video: false })
      .then(function (stream) {
        // You now have the audio stream
        const source = audioContext.createMediaStreamSource(stream)
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 256 // This can be adjusted depending on the desired resolution
        source.connect(analyser)
        analyser.connect(audioContext.destination)
        dataArray = new Uint8Array(analyser.frequencyBinCount)
        startedCapture = true
      })
      .catch(function (err) {
        console.error('Error capturing audio.', err)
      })
  })
  //  Now call layout the canvas, which will in turn call drawCanvas()
  await layoutCanvas()
}

/*
 * This function lays out the canvas, and calls drawCanvas() to draw the design
 * This gets called when the window is resized, and when the page first loads.
 *
 * It destroys any existing canvas elements, and creates a new one designed to
 * fit the window size, unless we are forcing the width via the url,
 * in which case it creates a canvas of that width.
 */
const layoutCanvas = async (windowObj = window) => {
  //  Kill the next animation frame (note, this isn't always used, only if we're animating)
  windowObj.cancelAnimationFrame(nextFrame)

  //  Get the window size, and devicePixelRatio
  const { innerWidth: wWidth, innerHeight: wHeight, devicePixelRatio = 1 } = windowObj
  const dpr = devicePixelRatio
  let cWidth = wWidth
  let cHeight = cWidth / ratio

  // If the height is too big, then we need to adjust the width to fit the height instead
  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight * ratio
  }

  // Grab any canvas elements so we can delete them
  const canvases = document.getElementsByTagName('canvas')
  Array.from(canvases).forEach(canvas => canvas.remove())

  // Now set the target width and height
  let targetHeight = cHeight
  let targetWidth = targetHeight * ratio

  // Update based on the dpr
  targetWidth *= dpr
  targetHeight *= dpr

  // Create a new canvas element, and append it to the body
  // based on all the size stuff we just worked out
  const canvas = document.createElement('canvas')
  canvas.id = 'target'
  canvas.width = targetWidth
  canvas.height = targetHeight
  document.body.appendChild(canvas)

  // Now we need to scale the canvas via CSS to make it fit the window
  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  // Finally we draw the canvas!
  drawCanvas()
}

const autoDownloadSVG = async (size) => {
  // Set the page width and height
  let format = 'A5'
  let pageWidth = 148
  let pageHeight = 210
  // Change the size to A4 or A6
  if (size === 6) {
    format = 'A6'
    pageWidth = 105
    pageHeight = 148
  }
  if (size === 4) {
    format = 'A4'
    pageWidth = 210
    pageHeight = 420
  }

  const dateTime = new Date().toISOString().split('.')[0].replace(/:/g, '-').replace('T', '-')

  let output = `<?xml version="1.0" standalone="no" ?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
  <svg version="1.1" id="lines" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  x="0" y="0"
  viewBox="0 0 ${pageWidth} ${pageHeight}"
  width="${pageWidth}mm"
  height="${pageHeight}mm" 
  xml:space="preserve">
  <g>
  `
  // Now loop through the all lines
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i]
    output += '<path d="'
    const p0 = line[0]
    output += `M${p0.x * pageWidth},${p0.y * pageHeight} `
    for (let j = 1; j < line.length; j++) {
      const point = line[j]
      output += `${point.x * pageWidth},${point.y * pageHeight} `
    }
    output += '" stroke="black" stroke-width="0.1" fill="none" />'
  }
  output += '</g></svg>'

  const element = document.createElement('a')
  element.setAttribute('download', `reactive-circle1_${dateTime}_${format}.svg`)
  element.style.display = 'none'
  document.body.appendChild(element)
  //  Blob code via gec @3Dgec https://twitter.com/3Dgec/status/1226018489862967297
  element.setAttribute('href', window.URL.createObjectURL(new Blob([output], {
    type: 'text/plain;charset=utf-8'
  })))
  element.click()
  document.body.removeChild(element)
}
/*
 * When everything in the DOM is loaded then we start everything off by calling init()
 *
 * If you have more complicated things going on, like pre-loading images or fonts in
 * some clever way, then you'd do that here, and then call init() when you know
 * everything is ready. For the moment though this one-liner is all we need.
 */
document.addEventListener('DOMContentLoaded', init)
