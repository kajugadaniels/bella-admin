import React from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './hooks/ProtectedRoute'
import AppLayout from './layout/AppLayout'
import { Dashboard, Login, NotFound } from './pages'

const AppRoutes = () => {
    return (
        <Routes>
            <Route path='/' element={<Login />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>
            </Route>

            <Route path='*' element={<NotFound />} />
        </Routes>
    )
}

export default AppRoutes
