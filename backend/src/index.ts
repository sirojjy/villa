import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { staticPlugin } from '@elysiajs/static'
import { authRoutes } from './api/auth'
import { userRoutes } from './api/users'
import { projectRoutes } from './api/projects'
import { bookingRoutes } from './api/bookings'
import { financeRoutes } from './api/finances'
import { dashboardRoutes } from './api/dashboard'

const app = new Elysia()
    .use(cors({
        origin: true,
        credentials: true
    }))
    .use(staticPlugin({
        assets: 'uploads',
        prefix: '/uploads'
    }))
    .use(swagger())
    .group('/api', app => 
        app
            .use(authRoutes)
            .use(userRoutes)
            .use(projectRoutes)
            .use(bookingRoutes)
            .use(financeRoutes)
            .use(dashboardRoutes)
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
