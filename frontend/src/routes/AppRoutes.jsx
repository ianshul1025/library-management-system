import { Routes, Route } from "react-router-dom";

import PublicLayout from "@/layouts/PublicLayout";

import Home from "@/pages/Home/Home";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;