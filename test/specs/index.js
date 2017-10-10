import curl from 'curl'
import ethicalServer from '../../src/index.js'

const pingServer = (url = 'http://localhost:8080') => {
    return new Promise((resolve, reject) => {
        curl.get(url, {}, (err, response, body) => {
            if (err) reject(err)
            const status = response.statusCode
            const port = parseInt(response.request.port)
            resolve({ body, status, port })
        })
    })
}

describe('server()', () => {
    it('should return api', () => {
        const server = ethicalServer()
        expect(server.use).toEqual(jasmine.any(Function))
        expect(server.listen).toEqual(jasmine.any(Function))
    })
})

describe('server().listen()', () => {
    it('should start server on default port', (done) => {
        ethicalServer()
        .listen()
        .then(destroyServer => {
            return pingServer().then(({ body, status, port }) => {
                expect(body).toBe('Not Found')
                expect(status).toBe(404)
                expect(port).toBe(8080)
                return destroyServer
            })
        })
        .then(destroyServer => {
            return destroyServer()
        })
        .then(() => {
            done()
        })
        .catch(e => console.error(e.stack || e))
    })
    it('should start server on specific port', (done) => {
        ethicalServer({ port: 9090 })
        .listen()
        .then(destroyServer => {
            return pingServer('http://localhost:9090')
                .then(({ body, status, port }) => {
                    expect(body).toBe('Not Found')
                    expect(status).toBe(404)
                    expect(port).toBe(9090)
                    return destroyServer
                })
        })
        .then(destroyServer => {
            return destroyServer()
        })
        .then(() => {
            done()
        })
        .catch(e => console.error(e.stack || e))
    })
})

describe('server().use()', () => {
    it('should register middleware', (done) => {
        ethicalServer()
        .use(async ({ response }, next) => {
            response.status = 200
            response.body = 'Hello World!'
            next()
        })
        .listen()
        .then(destroyServer => {
            return pingServer().then(({ body, status, port }) => {
                expect(body).toBe('Hello World!')
                expect(status).toBe(200)
                return destroyServer
            })
        })
        .then(destroyServer => {
            return destroyServer()
        })
        .then(() => {
            done()
        })
        .catch(e => console.error(e.stack || e))
    })

    it('should register multiple middleware', (done) => {
        ethicalServer()
        .use(async ({ response }, next) => {
            response.status = 100
            response.body = 'Hello '
            await next()
            response.body += '!'
            response.status += 1
        })
        .use(async ({ response }, next) => {
            response.status += 100
            response.body += 'World'
            next()
        })
        .listen()
        .then(destroyServer => {
            return pingServer().then(({ body, status, port }) => {
                expect(body).toBe('Hello World!')
                expect(status).toBe(201)
                return destroyServer
            })
        })
        .then(destroyServer => {
            return destroyServer()
        })
        .then(() => {
            done()
        })
        .catch(e => console.error(e.stack || e))
    })

    it('should log and exit on middleware errors', (done) => {
        const originalProcessExit = console.error
        const processExitSpy = jasmine.createSpy('process.exit')
        process.exit = processExitSpy

        const originalConsoleError = console.error
        const consoleErrorSpy = jasmine.createSpy('console.error')
        console.error = consoleErrorSpy

        ethicalServer()
        .use(async ({ response }, next) => {
            throw new Error('Hello World!')
        })
        .listen()
        .then(destroyServer => {
            return pingServer().then(({ body, status, port }) => destroyServer)
        })
        .then(destroyServer => {
            expect(consoleErrorSpy).toHaveBeenCalled()
            console.error = originalConsoleError
            expect(processExitSpy).toHaveBeenCalledWith(1)
            process.exit = originalProcessExit
            return destroyServer()
        })
        .then(() => {
            done()
        })
        .catch(e => console.log(e.stack || e))
    })
})
