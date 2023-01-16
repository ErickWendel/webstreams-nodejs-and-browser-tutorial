const API_URL = 'http://localhost:3000'
let counter = 0

async function consumeAPI(signal) {
  const response = await fetch(API_URL, {
    signal
  })
  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())
    // .pipeTo(new WritableStream({
    //   write(chunk) {
    //     console.log(++counter, 'chunk', chunk)
    //   }
    // }))

  return reader
}

function appendToHTML(element) {
  return new WritableStream({
    write({ title, description, url_anime}) {
      const card = `
      <article>
        <div class="text">
          <h3>[${++counter}] ${title}</h3>
          <p>${description.slice(0, 100)}</p>
          <a href="${url_anime}"> Here's why</a>
        </div>
      </article>
      `
      element.innerHTML += card
    },
    abort(reason) {
      console.log('aborted**', reason)
    }
  })
}
// essa função vai se certificar que caso dois chunks cheguem em uma unica transmissao
// converta corretamente para JSON
// dado:{}\n{}
// deve
//    {}
//    {}
function parseNDJSON() {
  let ndjsonBuffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      ndjsonBuffer += chunk
      const items = ndjsonBuffer.split('\n')
      items.slice(0, -1)
        .forEach(item => controller.enqueue(JSON.parse(item)))
      
      ndjsonBuffer = items[items.length -1]
    },
    flush(controller)  {
      if(!ndjsonBuffer) return;
      controller.enqueue(JSON.parse(ndjsonBuffer))
    }
  })
}
const [
  start,
  stop,
  cards
] = ['start', 'stop', 'cards'].map(item => document.getElementById(item))

let abortController = new AbortController()
start.addEventListener('click', async () => {
  try {
    const readable = await consumeAPI(abortController.signal)
    // add signal and await to handle the abortError exception after abortion
    await readable.pipeTo(appendToHTML(cards), { signal: abortController.signal })
  } catch (error) {
    if (!error.message.includes('abort')) throw error
  }
})

stop.addEventListener('click', () => {
  abortController.abort()
  console.log('aborting...')
  abortController = new AbortController()
})



