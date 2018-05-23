```text
          _                                        _            
         | |                                      (_)           
__  _____| |_ _ __ ___  __ _ _ __ ___ ______ _ __  _ _ __   ___ 
\ \/ / __| __| '__/ _ \/ _` | '_ ` _ \______| '_ \| | '_ \ / _ \
 >  <\__ \ |_| | |  __/ (_| | | | | | |     | |_) | | |_) |  __/
/_/\_\___/\__|_|  \___|\__,_|_| |_| |_|     | .__/|_| .__/ \___|
                                            | |     | |         
                                            |_|     |_|         
```

## Pipeable operators for xstream

Exports core xstream operators as pipeable operators.

## Installation

```bash
npm install xstream-pipe
```

## Example

```js
import xs from 'xstream'
import delay from 'xstream/extra/delay'
import { pipe, filter, map, endWhen, take } from 'xstream-pipe'

const operator = pipe(
  filter(i => i % 2 === 0),
  map(i => i * i),
  delay(60),
  endWhen(xs.periodic(5000).compose(take(1))),
)

// or `var stream = operator(xs.periodic(1000))`
var stream = xs.periodic(1000).compose(operator)

stream.addListener({
  next: i => console.log(i),
  error: err => console.error(err),
  complete: () => console.log('completed'),
})
```