import React from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './hooks/ProtectedRoute'
import AppLayout from './layout/AppLayout'
import { Dashboard, ForgetPassword, GetProducts, GetStockIn, GetStockOut, GetStores, Login, NotFound, ResetPassword, Verify } from './pages'
import AccountLayout from './layout/AccountLayout'

const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<AccountLayout />}>
                <Route path='/' element={<Login />} />
                <Route path='/verify' element={<Verify />} />
                <Route path='/forget-password' element={<ForgetPassword />} />
                <Route path='/reset-password' element={<ResetPassword />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/stores" element={<GetStores />} />

                    <Route path="/products" element={<GetProducts />} />

                    <Route path="/stockin" element={<GetStockIn />} />

                    <Route path="/stockout" element={<GetStockOut />} />
                </Route>
            </Route>

            <Route path='*' element={<NotFound />} />
        </Routes>
    )
}

export default AppRoutes
