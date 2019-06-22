# luminati.io api for nodejs


## Usage


```javascript
const { createClient } = require('luminati-api')

const client = createClient({
        email: '',
        password: '',
        customer: '',     
})

client.addIps({
    zone: 'my_zone', 
    zonePassword: '*******', 
    count: 1,
})
.then(newIps => {
    console.log(newIps)
})
```
