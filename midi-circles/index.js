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
const ratio = 1.414 / 1 // Canvas ratio (width / height, i.e. 3/4, 16/9, 1/1, 1/1.414 (Ax paper size))
// const prefix = 'plotter_sounds_midi_one' // The filename we use when saving an image

let resizeTmr = null

// This is also optional, and it used if we are animating the design
const animated = true
const allLines = []
const maxColours = 5
const currentFrame = 0
const sourceColours = [
  ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25'],
  ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  ['#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500'],
  ['#003049', '#d62828', '#f77f00', '#fcbf49', '#eae2b7'],
  ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'],
  ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557'],
  ['#9b5de5', '#f15bb5', '#fee440', '#00bbf9', '#00f5d4'],
  ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
  ['#2b2d42', '#8d99ae', '#edf2f4', '#ef233c', '#d90429'],
  ['#006d77', '#83c5be', '#edf6f9', '#ffddd2', '#e29578'],
  ['#10002b', '#240046', '#3c096c', '#5a189a', '#7b2cbf'],
  ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'],
  ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f'],
  ['#4d908e', '#577590', '#43aa8b', '#90be6d', '#f9c74f'],
  ['#277da1', '#577590', '#4d908e', '#43aa8b', '#f9c74f'],
  ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d'],
  ['#355070', '#6d597a', '#b56576', '#e56b6f', '#eaac8b']
]
const colours = sourceColours[Math.floor(Math.random() * sourceColours.length)]
let saveNextPass = false
let nextFrame = null // requestAnimationFrame, and the ability to clear it

const features = {}
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
  features.startTime = Date.now()
  features.vertLine = 0
  features.speed = 1
  features.lastTick = Date.now()
  features.activeMidiInputs = {}
  features.circles = {}
  features.currentCircleIndex = 0
  features.minNote = 48
  features.maxNote = 72
}
//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
setup()

const generateCirclePoints = (radius, numberOfPoints) => {
  const points = []
  for (let i = 0; i < numberOfPoints; i++) {
    const angle = (i / numberOfPoints) * (2 * Math.PI)
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    points.push({ x, y })
  }
  return points
}

const handleMidi = (midiData) => {
  const note = midiData[1]
  const volume = midiData[2]

  if (note < features.minNote) features.minNote = note - 2
  if (note > features.maxNote) features.maxNote = note + 2

  // If the volume is > 0 then we need to add a circle to the features.circles dict and also the features.activeMidiInputs array
  // If the volume is 0 then we need to remove the circle from the features.circles dict and also the features.activeMidiInputs array
  if (volume === 0 || features.activeMidiInputs[note] !== undefined) {
    features.circles[features.activeMidiInputs[note]].endTime = Date.now()
    delete features.activeMidiInputs[note]
  } else {
    const newCircle = {
      id: features.currentCircleIndex,
      note,
      volume,
      startTime: Date.now(),
      xPos: features.vertLine
    }
    features.circles[features.currentCircleIndex] = newCircle
    features.activeMidiInputs[note] = features.currentCircleIndex
    features.currentCircleIndex++
  }
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

  // Draw a vertical red line at the vertLine position (where vertLine is a value from 0-1 acting as a percent of the width)
  ctx.strokeStyle = 'red'
  ctx.lineWidth = w / 1000
  ctx.beginPath()
  ctx.moveTo(features.vertLine * w, 0)
  ctx.lineTo(features.vertLine * w, h)
  ctx.stroke()

  // Time stuff
  const nowTick = Date.now()
  const ticks = nowTick - features.lastTick

  // We want to divide the height of the canvas up by the number of notes we have
  const noteStep = h / (features.maxNote - features.minNote + 2)

  // Loop through all the features.circles and draw them
  ctx.lineWidth = h / 400

  allLines.length = 0
  for (let i = 0; i < maxColours; i++) {
    allLines.push([])
  }
  let c = 0

  for (const circle in features.circles) {
    const yPos = h - (features.circles[circle].note - features.minNote + 1) * noteStep
    const startRadius = h / 4000 * features.circles[circle].volume + h / 500
    let circleEndTime = Date.now()
    if (features.circles[circle].endTime) circleEndTime = features.circles[circle].endTime
    // Work out the duration of this circle
    const circleDuration = circleEndTime - features.circles[circle].startTime
    // Now we are going to draw a number of circles based on the duration of the note starting with the startRadius
    // and going up by h/500 for each 100ms of the duration
    for (let i = 0; i < circleDuration / 100; i++) {
      const colourIndex = (c + currentFrame) % maxColours
      ctx.strokeStyle = colours[colourIndex]

      const radius = startRadius + h / 150 * i
      const points = generateCirclePoints(radius, 90)
      const middleX = features.circles[circle].xPos * w
      const newLine = []
      const middleY = yPos
      ctx.beginPath()
      // move to the first point ofset by the middleX and middleY
      const startX = points[0].x + middleX
      const startY = points[0].y + middleY
      newLine.push({
        x: startX / w,
        y: startY / h
      })
      ctx.moveTo(startX, startY)
      for (let j = 1; j < points.length; j++) {
        const pointX = points[j].x + middleX
        const pointY = points[j].y + middleY
        newLine.push({
          x: pointX / w,
          y: pointY / h
        })
        ctx.lineTo(pointX, pointY)
      }
      newLine.push({
        x: startX / w,
        y: startY / h
      })
      ctx.lineTo(startX, startY) // Close the circle by connecting back to the start point
      ctx.stroke()
      allLines[colourIndex].push(newLine)
      c++
    }
  }

  // Update the vertLine position
  features.vertLine += ticks / 10000 * features.speed
  if (features.vertLine > 1) features.vertLine -= 1

  // Set the last tick to now
  features.lastTick = nowTick

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

    if (e.key === '3') saveNextPass = 3
    if (e.key === '4') saveNextPass = 4
    if (e.key === '5') saveNextPass = 5
    if (e.key === '6') saveNextPass = 6

    // if (e.key === 's') autoDownloadCanvas()
    // If the e.key is 'c' then we clear out the circles and activeMidiInputs
    if (e.key === 'c') {
      features.circles = {}
      features.activeMidiInputs = {}
    }
  })

  // We want to listen to midi events, for the moment let's just dump the midi events to the console
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(
      midiAccess => {
        midiAccess.inputs.forEach(midiInput => {
          midiInput.onmidimessage = (midiMessage) => {
            // console.log(midiMessage.currentTarget.name)
            if ((midiMessage.currentTarget.name === 'Komplete Kontrol Virtual Output' || midiMessage.currentTarget.name === 'Kontakt 5 Virtual Output') && midiMessage.data.byteLength === 3) {
              handleMidi(midiMessage.data)
            }
          }
        })
      },
      () => {
        console.error('Could not access MIDI devices.')
      }
    )
  } else {
    console.error('MIDI is not supported in this browser.')
  }

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
  let pageWidth = 210
  let pageHeight = 148
  // Change the size to A4 or A6
  if (size === 6) {
    format = 'A6'
    pageWidth = 148
    pageHeight = 105
  }
  if (size === 4) {
    format = 'A4'
    pageWidth = 297
    pageHeight = 210
  }
  if (size === 3) {
    format = 'A3'
    pageWidth = 420
    pageHeight = 297
  }

  // Scale the whole design down
  const scaleAmount = 0.95
  const topBottomMargin = pageHeight * ((1 - scaleAmount) / 2)
  const leftRightMargin = pageWidth * ((1 - scaleAmount) / 2)

  const dateTime = new Date().toISOString().split('.')[0].replace(/:/g, '-').replace('T', '-')
  for (let c = 0; c < maxColours; c++) {
    const scaledLines = allLines[c].map(line =>
      line.map(point => ({
        x: ((point.x - 0.5) * scaleAmount) + 0.5,
        y: ((point.y - 0.5) * scaleAmount) + 0.5
      }))
    )

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
    for (let i = 0; i < scaledLines.length; i++) {
      const line = scaledLines[i]
      // Now we need to do this twice, once for the fill in white with no stroke, this is
      // going to be used for the hidden line removal, and then once again with just the line at the top
      const p0 = line[0]
      output += '<path style="fill:none;stroke:#000000;stroke-width:0.3mm;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="'
      output += `M${p0.x * pageWidth},${p0.y * pageHeight - 0.01} `
      for (let j = 1; j < line.length; j++) {
        const point = line[j]
        output += `${point.x * pageWidth},${point.y * pageHeight - 0.01} `
      }
      output += '" />'
    }

    // Now we want to draw a margin around the page in solid red with no stroke
    output += '<path style="fill:#FF0000;stroke:none" d="'
    output += `M0,0 ${pageWidth},0 ${pageWidth},${pageHeight} 0,${pageHeight}, 0,${topBottomMargin} `
    output += `${leftRightMargin},${topBottomMargin} ${leftRightMargin},${pageHeight - topBottomMargin} `
    output += `${pageWidth - leftRightMargin},${pageHeight - topBottomMargin} ${pageWidth - leftRightMargin},${topBottomMargin}, 0,${topBottomMargin}`
    output += '" />'
    output += '</g></svg>'

    const element = document.createElement('a')
    element.setAttribute('download', `midicircles_${dateTime}_${format}_${c}.svg`)
    element.style.display = 'none'
    document.body.appendChild(element)
    //  Blob code via gec @3Dgec https://twitter.com/3Dgec/status/1226018489862967297
    element.setAttribute('href', window.URL.createObjectURL(new Blob([output], {
      type: 'text/plain;charset=utf-8'
    })))
    element.click()
    document.body.removeChild(element)
  }
}

/*
 * When everything in the DOM is loaded then we start everything off by calling init()
 *
 * If you have more complicated things going on, like pre-loading images or fonts in
 * some clever way, then you'd do that here, and then call init() when you know
 * everything is ready. For the moment though this one-liner is all we need.
 */
document.addEventListener('DOMContentLoaded', init)
