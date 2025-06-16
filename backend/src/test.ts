async function fetch_code() {
    const url = "http://localhost:3001/get-code"

    try {
        const res = await fetch(url, { method: "GET" })
        const data = await res.json()
        console.log(data)
        return data
    } catch (error) {
        console.log('error', error)
    }
}

console.log(fetch_code())