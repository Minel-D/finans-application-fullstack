import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();

	const handleLogin = async (e) => {
		e.preventDefault();

		// Backend'e form verisi olarak gönderiyoruz (OAuth2 standardı)
		const formData = new URLSearchParams();
		formData.append("username", email);
		formData.append("password", password);

		try {
			const response = await fetch("http://127.0.0.1:8000/token", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: formData,
			});

			if (response.ok) {
				const data = await response.json();
				// Token'ı tarayıcı hafızasına (LocalStorage) kaydet
				localStorage.setItem("token", data.access_token);
				// Ana sayfaya yönlendir
				navigate("/");
			} else {
				alert("Giriş başarısız! Email veya şifre yanlış.");
			}
		} catch (error) {
			console.error("Hata:", error);
		}
	};

	return (
		<div className="container mt-5" style={{ maxWidth: "400px" }}>
			<div className="card shadow">
				<div className="card-body">
					<h3 className="text-center mb-4">Giriş Yap 🔐</h3>
					<form onSubmit={handleLogin}>
						<div className="mb-3">
							<label>Email</label>
							<input
								type="email"
								className="form-control"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="mb-3">
							<label>Şifre</label>
							<input
								type="password"
								className="form-control"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						<button type="submit" className="btn btn-primary w-100">
							GİRİŞ YAP
						</button>
					</form>
					<p className="mt-3 text-center">
						Hesabın yok mu? <Link to="/register">Kayıt Ol</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Login;
