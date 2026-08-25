import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import CustomerDashboard from "../pages/Customer/CustomerDashboard";
import MyOrders from "../components/customer/MyOrders";
import OrderDetails from "../components/customer/OrderDetails";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminOrders from "../components/admin/Orders";
import NotFound from "../pages/Errors/NotFound";
import LandingPage from "../pages/LandingPage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/orders",
    element: <MyOrders />,
  },
  {
    path: "/orders/:id",
    element: <OrderDetails />,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
  {
    path: "/customer",
    element: <CustomerDashboard />,
  },
  {
    path: "/admin/orders",
    element: <AdminOrders />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
