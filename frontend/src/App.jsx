import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";

// --- KORUMALI ROTA (PRIVATE ROUTE) ---
// Bu bir güvenlik görevlisidir.
// Token varsa çocuğun (Dashboard) geçmesine izin verir.
// Yoksa "Hadi Login'e" der.
const PrivateRoute = ({ children }) => {
	const token = localStorage.getItem("token");
	return token ? children : <Navigate to="/login" />;
};

function App() {
	return (
		<Routes>
			{/* 1. Giriş Sayfası (Herkes Girebilir) */}
			<Route path="/login" element={<Login />} />

			{/* 2. Kayıt Sayfası (Herkes Girebilir) */}
			<Route path="/register" element={<Register />} />

			{/* 3. Ana Sayfa (SADECE TOKENI OLANLAR GİREBİLİR) */}
			<Route
				path="/"
				element={
					<PrivateRoute>
						<Dashboard />
					</PrivateRoute>
				}
			/>
		</Routes>
	);
}

export default App;
