import React from "react";
import { Outlet } from "react-router-dom";
import { Header, Sidebar } from "@/components/shared";

const AppLayout = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950">
            {/* Sticky header (already styled to be container-aware) */}
            <Header />

            {/* Page shell: width-constrained container for sidebar + content */}
            <div className="mx-auto px-4 sm:px-6 md:px-4">
                {/* Clearfix wrapper so floated sidebar doesn't overlap content */}
                <div className="relative md:pt-2 md:after:content-[''] md:after:block md:after:clear-both">
                    {/* Desktop rail + Mobile sheet (from component) */}
                    <Sidebar />

                    {/* Main content area */}
                    <main role="main" className="pb-10 md:pl-4 md:min-h-[calc(100vh-5rem)]"
                    >
                        {/* Optional top spacing below header on small screens */}
                        <div className="pt-4 md:pt-3">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
