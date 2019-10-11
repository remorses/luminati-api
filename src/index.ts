import fetch from 'node-fetch'
import base64 from 'base-64'
import { log, parse } from './support'

const mapErrorToJson = async (res) => {
    const text = await res.text()
    const data = parse(text)
        .then((data) => ({
            ...data,
            ok: true
        }))
        .catch((e) => ({
            ok: false,
            message: text
        }))
    return data
}

export interface Client {
    enableZone: ({ zone }) => Promise<any>
    disableZone: ({ zone }) => Promise<any>
    removeIps(options: { ips: string[]; zone: string }): Promise<string[]>
    addIps(options: {
        count: number
        zone: string
        zonePassword: string
    }): Promise<string[]>
    availableIps(options: {
        zone: string
        zonePassword: string
    }): Promise<string[]>
    removeIps(options: { ips: string[]; zone: string }): Promise<string[]>
    refreshIps(options: { ips: string[]; zone: string }): Promise<string[]>
}

export const createClient = ({ email, password, customer }): Client => {
    const defaults = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + base64.encode(email + ":" + password),
        },
        method: 'POST'
    }
    let client: Client = {} as any
    client.addIps = async ({ count = 1, zone, zonePassword=null }) => {
        // returns only the added ips
        if (!zone) {
            throw new Error('zone is needed')
        }
        // const previousIps = await client.availableIps({ zone, zonePassword })
        return await fetch('https://luminati.io/api/add_ips', {
            ...defaults,
            body: JSON.stringify({
                customer,
                zone,
                count
            })
        })
            .then(mapErrorToJson)
            .then((data) => {
                if (!data.ok) throw new Error(data.message)
                return data
            })
            .then((data) => {
                return data.new_ips
            })
    }
    client.availableIps = ({ zone, zonePassword }) => {
        // curl "https://luminati.io/api/get_route_ips?" -H "X-Hola-Auth: lum-customer-CUSTOMER-zone-ZONE-key-PASSWORD"
        return fetch('https://luminati.io/api/get_route_ips?expand=1', {
            ...defaults,
            headers: {
                ...defaults.headers,
                'Content-Type': 'application/json',
                'X-Hola-Auth': `lum-customer-${customer}-zone-${zone}-key-${zonePassword}`
            },
            method: 'GET'
        }).then(async (res) => {
            const text = await res.text()
            const rx = /(\d+\.\d+\.\d+\.\d+(\n)?)+/
            if (!rx.test(text)) {
                return []
            }
            return text.split('\n')
        })
    }
    client.removeIps = ({ ips, zone }) => {
        // returns only the removed ips
        if (!ips) {
            throw new Error('at least one ip is needed')
        }
        if (!zone) {
            throw new Error('zone is needed')
        }
        // curl -X DELETE "https://luminati.io/api/zone/ips" -H "Content-Type: application/json" -d '{"customer":"CUSTOMER","zone":"ZONE","ips":["ip1","ip2"]}' -u "username:password"
        return fetch('https://luminati.io/api/zone/ips', {
            ...defaults,
            method: 'DELETE',
            body: JSON.stringify({
                customer,
                zone,
                ips,
            })
        })
            .then(mapErrorToJson)
            .then((data) => {
                if (!data.ok) throw new Error(data.message)
                return data
            })
            .then((data) => {
                return data.ips
            })
    }
    client.refreshIps = ({ ips, zone }) => {
        if (!ips) {
            throw new Error('at least one ip is needed')
        }
        if (!zone) {
            throw new Error('zone is needed')
        }
        return fetch('https://luminati.io/api/refresh', {
            ...defaults,
            body: JSON.stringify({
                customer,
                zone,
                ips
            })
        })
            .then(mapErrorToJson)
            .then((data) => {
                if (!data.ok) throw new Error(data.message)
                return data
            })
            .then((data) => {
                return data.ips
            })
    }
    const toggleZone = ({ zone, disable }) => {
        if (!zone) {
            throw new Error('zone is needed')
        }
        // curl -X POST "" -d '{"customer":"CUSTOMER","zone":"ZONE","disable":1}' -u "username:password"
        return fetch('https://luminati.io/api/zone/change_disable', {
            ...defaults,
            body: JSON.stringify({
                customer,
                zone,
                disable,
            })
        })
            .then(mapErrorToJson)
            .then((data) => {
                if (!data.ok) throw new Error(data.message)
                return data
            })
            .then((data) => {
                return data.ips
            })
    }
    client.enableZone = ({zone}) => toggleZone({zone, disable: 0})
    client.disableZone = ({zone}) => toggleZone({zone, disable: 1})
    return client
}
