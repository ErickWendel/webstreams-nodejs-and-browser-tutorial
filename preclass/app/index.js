const API_URL = 'http://localhost:3000'

async function consumeAPI(signal) {
  const response = await fetch(API_URL, {
    signal
  })

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())

  return reader
}

function parseNDJSON() {
  let ndjsonBuffer = ''

  return new TransformStream({
    transform(ndjsonChunk, controller) {
      ndjsonBuffer += ndjsonChunk
      const jsonValues = ndjsonBuffer.split('\n')
      jsonValues.slice(0, -1)
        .forEach((jsonValue) => controller.enqueue(JSON.parse(jsonValue)))

      ndjsonBuffer = jsonValues[jsonValues.length - 1]
    },
    flush(controller) {
      if (!ndjsonBuffer) return
      controller.enqueue(JSON.parse(ndjsonBuffer))
    }
  })
}

function appendToHTML(el) {
  return new WritableStream({
    async write({ title, description, url_anime }) {
      const card = `
        <article>
          <div class="text">
            <h3>[${++counter}] ${title}</h3>
            <p>${description.slice(0, 100)}</p>
            <a href="${url_anime}">Here's why</a>
          </div>
        </article>
        `
      el.innerHTML += card
    },
    abort(reason) {
      console.log('aborted**', reason)
    }
  })
}

const [
  start,
  stop,
  cards
] = ['Start', 'Stop', 'cards']
  .map(
    id => document.getElementById(id)
  )

let abortController = new AbortController()
let counter = 0

start.addEventListener('click', async () => {
  const reader = await consumeAPI(abortController.signal)
  reader.pipeTo(appendToHTML(cards))
})

stop.addEventListener('click', () => {
  abortController.abort()
  console.log('aborting...')
  abortController = new AbortController()
})