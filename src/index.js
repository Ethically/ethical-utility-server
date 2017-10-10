import Koa from 'koa'
import serverDestroy from 'server-destroy'

const ethicalServer = (opts = {}) => {
    const port = ( parseInt(opts.port) ? opts.port : 8080 )
    const app = new Koa()
    const api = {
        use: (middleware) => {
            const wrapper = async (ctx, next) => {
                try {
                    await middleware(ctx, next)
                } catch (e) {
                    console.error(`Middleware (${middleware}): ${e.stack}`)
                    process.exit(1)
                }
            }
            app.use(wrapper)
            return api
        },
        listen: () => new Promise(resolve => {
            const instance = app.listen(port, () => {
                serverDestroy(instance)
                const destroyServer = () => {
                    return new Promise(resolve => {
                        const callback = () => {
                            resolve()
                        }
                        return instance.destroy(callback)
                    })
                }
                resolve(destroyServer)
            })
        })
    }
    return api
}

export default ethicalServer
