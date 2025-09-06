import React from "react";
import { Outlet } from "react-router-dom";
import { Header, Sidebar } from "@/components/shared";

const AppLayout = () => {
    return (
        <div className="h-screen w-full flex flex-col bg-white">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop sidebar */}
                <Sidebar />
                {/* Main content area */}
                <main className="flex-1 overflow-y-auto no-scrollbar bg-secondary/30">
                    <div className="mx-auto p-4 sm:p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
