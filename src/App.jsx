import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { Toaster } from '@/components/ui/sonner';

const App = () => {
    return (
        <>
            <Router>
                <AppRoutes />

                <Toaster
                    position="bottom-right"
                    richColors
                    closeButton
                    expand={false}
                    duration={3000}
                    toastOptions={{
                        className: 'text-[14px]',
                    }}
                />
            </Router>
        </>
    );
};

export default App;
