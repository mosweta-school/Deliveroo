import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import CustomerDashboard from "../pages/Customer/Dashboard";
import Orders from "../pages/Customer/Orders";
import OrderDetails from "../pages/Customer/OrderDetails";
import AdminDashboard from "../pages/Admin/Dashboard";
import AdminOrders from "../pages/Admin/Orders";
import NotFound from "../pages/Errors/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <CustomerDashboard />,
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
    element: <Orders />,
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
    path: "/admin/orders",
    element: <AdminOrders />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
