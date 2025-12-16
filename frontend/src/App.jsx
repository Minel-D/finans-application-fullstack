import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";
import Profile from "./components/Profile";
import Settings from "./components/Settings";

// Basit bir güvenlik kontrolü (Token var mı?)
const PrivateRoute = ({ children }) => {
	const token = localStorage.getItem("token");
	return token ? children : <Navigate to="/login" />;
};

function App() {
	return (
		<Router>
			<Routes>
				{/* 1. Ana Sayfa artık LandingPage */}
				<Route path="/" element={<LandingPage />} />

				{/* 2. Login ve Register sayfaları */}
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />

				{/* 3. Dashboard korumalı alan */}
				<Route
					path="/dashboard"
					element={
						<PrivateRoute>
							<Dashboard />
						</PrivateRoute>
					}
				/>
				<Route
					path="/profile"
					element={
						<PrivateRoute>
							<Profile />
						</PrivateRoute>
					}
				/>
				<Route
					path="/settings"
					element={
						<PrivateRoute>
							<Settings />
						</PrivateRoute>
					}
				/>
			</Routes>
		</Router>
	);
}

export default App;
