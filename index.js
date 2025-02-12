const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3005


//middlewares
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send("Boss is running....")
})

app.listen(port, ()=> {
    console.log(`Bistro Boss is Sitting on port ${port} `)
})