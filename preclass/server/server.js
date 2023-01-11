/*
echo "id,name,desc,age" > big.csv
for i in `seq 1 1500`; do node -e "process.stdout.write('$i,erick-$i,'+'$i-text'.repeat(1e5)+',$i\n')" >> big.csv;done
*/
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import csvtojson from 'csvtojson'
import { Transform } from 'node:stream'

const PORT = 3000
// curl -N localhost:3000
createServer((request, response) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204, headers)
    response.end()
    return
  }

  let items = 0
  request.once('close', () => console.log('connection was closed!', items))
  createReadStream('./animeflv.csv')
    .pipe(csvtojson())
    .pipe(Transform({
      transform(chunk, enc, cb) {
        items++
        const d = JSON.parse(chunk)
        setTimeout(() => {
          cb(
            null,
            JSON.stringify({
              title: d.title,
              description: d.description,
              url_anime: d.url_anime,
              image: d.image
            }).concat('\n')
          )
        }, 200)

      }
    }))
    .pipe(response)

  response.writeHead(200, headers)

})
  .listen(PORT)
  .on('listening', _ => console.log('server running at ', PORT))