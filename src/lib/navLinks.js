import {
    Home,
    User2,
    UserCheck,
    UserCog,
    Building2,
    Package,
    TruckIcon,
    Boxes,
    Truck,
    Settings,
    LogOut,
} from "lucide-react";

export const navLinks = [
    { to: "/dashboard", icon: Home, label: "Dashboard", end: true },
    { to: "/admins", icon: User2, label: "Admins", end: true },
    { to: "/clients", icon: UserCheck, label: "Clients", end: true },
    { to: "/store-members", icon: UserCog, label: "Store Members", end: true },
    { to: "/stores", icon: Building2, label: "Stores" },
    { to: "/products", icon: Package, label: "Products" },
    { to: "/orders", icon: TruckIcon, label: "Orders" },
    // { to: "/stockin", icon: Boxes, label: "Stock In" },
    { to: "/stockout", icon: Truck, label: "Stock Out" },
];

export const bottomLinks = [
    // { to: "/settings", icon: Settings, label: "Settings" },
];

export const logoutLink = {
    icon: LogOut,
    label: "Sign Out",
};
