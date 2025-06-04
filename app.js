const express = require('express')
const cors = require('cors')
const { getCode } = require('./otp');
const app = express()
app.use(cors());
const port = 3001

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/get-code', async (req, res) => {
    const info = await getCode()
    console.log(info)
    res.send(info[0])
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})