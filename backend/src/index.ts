import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { authRoutes } from './api/auth'
import { userRoutes } from './api/users'
import { projectRoutes } from './api/projects'

const app = new Elysia()
    .use(cors({
        origin: true,
        credentials: true
    }))
    .use(swagger())
    .group('/api', app => 
        app
            .use(authRoutes)
            .use(userRoutes)
            .use(projectRoutes)
    )
    .get('/', () => ({
        message: 'Villa Management System API',
        version: '1.0.0',
        status: 'online'
    }))
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
