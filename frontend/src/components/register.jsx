import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();

	const handleRegister = async (e) => {
		e.preventDefault();

		try {
			const response = await fetch("http://127.0.0.1:8000/users/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (response.ok) {
				alert("Kayıt başarılı! Giriş yapabilirsiniz.");
				navigate("/login");
			} else {
				alert("Kayıt başarısız. Bu email kullanılıyor olabilir.");
			}
		} catch (error) {
			console.error("Hata:", error);
		}
	};

	return (
		<div className="container mt-5" style={{ maxWidth: "400px" }}>
			<div className="card shadow">
				<div className="card-body">
					<h3 className="text-center mb-4">Kayıt Ol 📝</h3>
					<form onSubmit={handleRegister}>
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
						<button type="submit" className="btn btn-success w-100">
							KAYIT OL
						</button>
					</form>
					<p className="mt-3 text-center">
						Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Register;
