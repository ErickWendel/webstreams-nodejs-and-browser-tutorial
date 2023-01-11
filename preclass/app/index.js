const API_URL = 'http://localhost:3000'
async function* startConsumingAPI(signal) {
  const response = await fetch(API_URL, {
    signal
  })

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())
    .getReader()

  let done = false
  do {
    const res = await reader.read()
    done = res.done
    if (done) break
    yield res.value
  }
  while (!done)
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

function appendToHTML({ title, description,url_anime, image }, el) {
  const card = `
  <article>
    <div class="text">
      <h3>${title}</h3>
      <p>${description.slice(0, 100)}</p>
      <a href="${url_anime}">Here's why</a>
    </div>
  </article>
  `
  el.innerHTML += card
}

const [start, stop, cards] = ['Start', 'Stop', 'cards'].map(id => document.getElementById(id))

let abortController = new AbortController()
start.addEventListener('click', async () => {
  const it = startConsumingAPI(abortController.signal)
  let counter = 0
  try {
    for await (const item of it) {
      counter++
      console.log('item', counter, item.title)
      appendToHTML(item, cards)
      // if (counter >= 10) {
      //   abortController.abort()
      // }
    }
  } catch (error) {
    if (!error.message.includes('aborted')) throw error
  }
})

stop.addEventListener('click', () => {
  abortController.abort()
  console.log('aborting...')
  abortController = new AbortController()
})