import React from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './hooks/ProtectedRoute'
import AppLayout from './layout/AppLayout'
import { Dashboard, ForgetPassword, GetAdmins, GetClients, GetOrders, GetProducts, GetStockIn, GetStockOut, GetStoreMembers, GetStores, Login, NotFound, ResetPassword, Verify } from './pages'
import AccountLayout from './layout/AccountLayout'

const AppRoutes = () => {
    return (
		<Routes>
			<Route element={<AccountLayout />}>
				<Route path="/" element={<Login />} />
				<Route path="/verify" element={<Verify />} />
				<Route path="/forget-password" element={<ForgetPassword />} />
				<Route path="/reset-password" element={<ResetPassword />} />
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route element={<AppLayout />}>
					<Route path="/dashboard" element={<Dashboard />} />

					<Route path="/admins" element={<GetAdmins />} />

					<Route path="/clients" element={<GetClients />} />

					<Route path="/store-members" element={<GetStoreMembers />} />

					<Route path="/stores" element={<GetStores />} />

					<Route path="/products" element={<GetProducts />} />

					{/* <Route path="/stockin" element={<GetStockIn />} />

					<Route path="/stockout" element={<GetStockOut />} /> */}

					<Route path="/orders" element={<GetOrders />} />

					<Route path="*" element={<NotFound />} />
				</Route>
			</Route>
		</Routes>
	);
}

export default AppRoutes
