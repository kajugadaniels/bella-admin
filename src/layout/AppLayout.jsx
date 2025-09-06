import { Header, Sidebar } from '@/components/shared'
import React from 'react'
import { Outlet } from 'react-router-dom'

const AppLayout = () => {
    return (
        <div>
            <Header />
            <Sidebar />
            <Outlet />
        </div>
    )
}

export default AppLayout