import { strict as assert } from 'assert'
import {createClient} from '../index'

const log = console.log

const {
    email,
    password,
    customer,
    zone,
    zonePassword,
} = process.env as any

it('have credentials', () => {
    assert.ok(email)
    assert.ok(password)
    assert.ok(customer)
    assert.ok(zone)
    assert.ok(zonePassword)
})

it('works', () => {
    assert.ok(true)
})



it('availableIps', async() => {
    const client = createClient({
        email,
        password,
        customer,
    })
    await client.availableIps({zone, zonePassword}).then(console.log)
})

it('addIps', async() => {
    const client = createClient({
        email,
        password,
        customer,
        
    })
    await client.addIps({zone, zonePassword, count: 1,}).then(console.log)
})

it('removeIps', async() => {
    const client = createClient({
        email,
        password,
        customer,
    })
    const ip = (await client.availableIps({zone, zonePassword}))[0]
    log('removing ' + ip)
    await client.removeIps({ips: [ip], zone}).then(console.log)
})