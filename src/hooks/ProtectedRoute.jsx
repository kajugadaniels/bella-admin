import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { toast } from "sonner";

const ProtectedRoute = () => {
    const token = localStorage.getItem('token')
    const location = useLocation()

    if (!token) {
        toast.error('This page is forbidden.')
        return <Navigate to="/?error=unauthorized" state={{ from: location }} replace />
    }

    return <Outlet />
}

export default ProtectedRoute
