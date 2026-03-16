const { Client } = require('pg')
require('dotenv').config()

// const PROJECT_ID = process.env.PROJECT_ID
const CHANNEL = `logs:adamant-puny-nest`

async function startSubscriber() {

    const client = new Client({
        connectionString: process.env.DATABASE_URI
    })

    await client.connect()

    console.log("Subscriber connected to DB")

    await client.query(`LISTEN "${CHANNEL}"`)

    console.log(`Listening on channel: ${CHANNEL}`)
    
    const res = await client.query("select current_database(), inet_server_addr()")
    console.log(res.rows)

    client.on('notification', async (msg) => {

        const payload = msg.payload

        console.log("Received log:", payload)

        // TODO:
        // send to websocket
        // store in DB
        // push to UI
    })

    client.on('error', (err) => {
        console.error("DB Error", err)
        process.exit(1)
    })
}

startSubscriber()
