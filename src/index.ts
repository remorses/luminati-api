
import fetch from 'node-fetch'
import { log, parse } from './support'




const mapErrorToJson = async res => {
    const text = await res.text()
    const data = parse(text)
        .then(data => ({
            ...data,
            ok: true
        }))
        .catch(e => ({
            ok: false,
            message: text,
        }))
    return data
    
}

interface Client  {
    removeIps(options: {ips: string[], zone: string}): Promise<string[]>
    addIps(options: {count: number, zone: string, zonePassword: string}): Promise<string[]>
    availableIps(options: {zone: string, zonePassword: string}): Promise<string[]>
    removeIps(options: {ips: string[], zone: string}): Promise<string[]>
    refreshIps(options: {ips: string[], zone: string}): Promise<string[]>
}



export const createClient = ({
    email,
    password,
    customer,
}): Client=> {
    const defaults = {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
    }
    let client: Client = {} as any
    client.addIps = async ({count=1, zone, zonePassword}) => { // returns only the added ips
            if(!zone) {
                throw new Error('zone is needed')
            }
            const previousIps = await client.availableIps({zone, zonePassword})
            return await fetch('https://luminati.io/api/add_ips', {
                ...defaults,
                body: JSON.stringify({
                    email,
                    password,
                    customer,
                    zone,
                    count: 1,
                })
            }).then(mapErrorToJson)
            .then(data => {
                if (!data.ok) throw new Error(data.message)
                return data
            })
            .then(data => {
                const all = data.ips
                return all.filter(ip => !previousIps.find(x => x==ip))
            })
    }
    client.availableIps = ({zone, zonePassword}) => {
        // curl "https://luminati.io/api/get_route_ips?" -H "X-Hola-Auth: lum-customer-CUSTOMER-zone-ZONE-key-PASSWORD"
        return fetch('https://luminati.io/api/get_route_ips?expand=1', {
            ...defaults,
            headers: {
                'Content-Type': 'application/json',
                'X-Hola-Auth': `lum-customer-${customer}-zone-${zone}-key-${zonePassword}`
            },
            method: 'GET'
        })
        .then(async (res) => {
            const text = await res.text()
            const rx = /(\d+\.\d+\.\d+\.\d+(\n)?)+/
            if (!rx.test(text)) {
                return []
            }
            return text.split('\n')
        })
    }
    client.removeIps = ({ips, zone}) => { // returns only the removed ips
            if(!ips) {
                throw new Error('at least one ip is needed')
            }
            if(!zone) {
                throw new Error('zone is needed')
            }
            return fetch('https://luminati.io/api/remove_ips', {
                ...defaults,
                body: JSON.stringify({
                    email,
                    password,
                    customer,
                    zone,
                    ips,
                })
            }).then(mapErrorToJson)
            .then(data => {
                if (!data.ok) throw new Error(data.message)
                return data
            })
            .then(data => {
                return data.ips
            })
    }
    client.refreshIps = ({ips, zone}) => {
        if(!ips) {
            throw new Error('at least one ip is needed')
        }
        if(!zone) {
            throw new Error('zone is needed')
        }
        return fetch('https://luminati.io/api/refresh', {
            ...defaults,
            body: JSON.stringify({
                email,
                password,
                customer,
                zone,
                ips,
            })
        }).then(mapErrorToJson)
        .then(data => {
            if (!data.ok) throw new Error(data.message)
            return data
        })
        .then(data => {
            return data.ips
        })
    }
    
    return client
}



