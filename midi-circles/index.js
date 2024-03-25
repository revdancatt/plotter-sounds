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

const handleMidi = (midiData) => {
  const note = midiData[1]
  const volume = midiData[2]

  // If the volume is > 0 then we need to add a circle to the features.circles dict and also the features.activeMidiInputs array
  if (volume > 0) {
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

  // If the volume is 0 then we need to remove the circle from the features.circles dict and also the features.activeMidiInputs array
  if (volume === 0) {
    features.circles[features.activeMidiInputs[note]].endTime = Date.now()
    delete features.activeMidiInputs[note]
  }
  console.log(features.activeMidiInputs)
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
  ctx.lineWidth = 2
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
  ctx.strokeStyle = 'black'
  ctx.lineWidth = h / 600
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
      const radius = startRadius + h / 200 * i
      ctx.beginPath()
      ctx.arc(features.circles[circle].xPos * w, yPos, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // Update the vertLine position
  features.vertLine += ticks / 10000 * features.speed
  if (features.vertLine > 1) features.vertLine -= 1

  // Set the last tick to now
  features.lastTick = nowTick

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
            if (midiMessage.currentTarget.name === 'Komplete Kontrol Virtual Output' && midiMessage.data.byteLength === 3) {
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

/*
 * When everything in the DOM is loaded then we start everything off by calling init()
 *
 * If you have more complicated things going on, like pre-loading images or fonts in
 * some clever way, then you'd do that here, and then call init() when you know
 * everything is ready. For the moment though this one-liner is all we need.
 */
document.addEventListener('DOMContentLoaded', init)