import React from 'react'
import { Outlet } from 'react-router-dom'

const AppLayout = () => {
    return (
        <div>
            <Outlet />
            AppLayout
        </div>
    )
}

export default AppLayout