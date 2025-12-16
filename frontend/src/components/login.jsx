import { useState } from "react";
import { useNavigate } from "react-router-dom";
// EKSİK OLAN IMPORT EKLENDİ (Beyaz ekranı bu çözer)
import { login } from "../api";

// İkonlara BsArrowLeft eklendi
import {
	BsEnvelope,
	BsLock,
	BsArrowRightCircle,
	BsEye,
	BsEyeSlash,
	BsArrowLeft,
} from "react-icons/bs";

function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	// Şifre görünür mü? State'i
	const [showPassword, setShowPassword] = useState(false);

	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(""); // Önceki hatayı temizle

		try {
			const data = await login(email, password);
			if (data.access_token) {
				localStorage.setItem("token", data.access_token);
				navigate("/dashboard");
			} else {
				setError("Beklenmedik bir yanıt alındı.");
			}
		} catch (err) {
			// DÜZELTME: Sabit mesaj yerine, api.js'den gelen gerçek hatayı yazdırıyoruz.
			console.error("Giriş Hatası:", err); // Tarayıcı konsoluna (F12) detay basar
			setError(err.message || "Giriş başarısız! Sunucu hatası.");
		}
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: "'Libre Baskerville', serif",
				position: "relative",
				overflow: "hidden",
			}}>
			{/* --- YENİ EKLENEN ANA SAYFA BUTONU --- */}
			<div
				style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10 }}>
				<button
					onClick={() => navigate("/")}
					className="btn btn-light shadow-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2"
					style={{
						color: "#1e3c72",
						border: "1px solid #e2e8f0",
						fontSize: "0.9rem",
					}}>
					<BsArrowLeft size={18} /> Ana Sayfa
				</button>
			</div>

			{/* --- ARKA PLAN --- */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					backgroundImage: "url('/finans.webp')",
					backgroundSize: "cover",
					backgroundPosition: "center",
					opacity: 0.4,
					zIndex: -1,
				}}></div>

			{/* --- CAM EFEKTLİ KART --- */}
			<div
				className="card shadow-lg border-0 p-5"
				style={{
					width: "100%",
					maxWidth: "450px",
					background: "rgba(255, 255, 255, 0.85)",
					backdropFilter: "blur(12px)",
					borderRadius: "20px",
				}}>
				<div className="text-center mb-4">
					<h2
						className="fw-bold"
						style={{
							fontFamily: "'Dancing Script', cursive",
							color: "#1e3c72",
							fontSize: "2.5rem",
						}}>
						Hoş Geldiniz
					</h2>
					<p className="text-muted small">
						FinanceAgent AI hesabınıza giriş yapın
					</p>
				</div>

				{error && (
					<div className="alert alert-danger text-center py-2 small">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					{/* Email Input */}
					<div className="mb-3">
						<label className="form-label small fw-bold text-secondary">
							E-Posta Adresi
						</label>
						<div className="input-group">
							<span className="input-group-text bg-white border-end-0 text-primary">
								<BsEnvelope />
							</span>
							<input
								type="email"
								className="form-control border-start-0 ps-0"
								placeholder="ornek@mail.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								style={{ boxShadow: "none" }}
							/>
						</div>
					</div>

					{/* Şifre Input (GÖZ İKONLU) */}
					<div className="mb-4">
						<label className="form-label small fw-bold text-secondary">
							Şifre
						</label>
						<div className="input-group">
							{/* Kilit İkonu */}
							<span className="input-group-text bg-white border-end-0 text-primary">
								<BsLock />
							</span>

							{/* Input: Tipe dikkat (showPassword ? "text" : "password") */}
							<input
								type={showPassword ? "text" : "password"}
								className="form-control border-start-0 border-end-0 ps-0"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								style={{ boxShadow: "none" }}
							/>

							{/* GÖZ İKONU BUTTONU */}
							<span
								className="input-group-text bg-white border-start-0 text-secondary"
								style={{ cursor: "pointer" }}
								onClick={() => setShowPassword(!showPassword)}
								title={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}>
								{showPassword ? <BsEyeSlash /> : <BsEye />}
							</span>
						</div>
					</div>

					<button
						type="submit"
						className="btn btn-primary w-100 py-2 rounded-pill fw-bold shadow-sm"
						style={{
							background: "linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)",
							border: "none",
						}}>
						Giriş Yap <BsArrowRightCircle className="ms-2" />
					</button>
				</form>

				<div className="text-center mt-4 pt-3 border-top">
					<p className="small text-muted mb-0">Hesabınız yok mu?</p>
					<button
						onClick={() => navigate("/register")}
						className="btn btn-link text-decoration-none fw-bold"
						style={{ color: "#1e3c72" }}>
						Hemen Kaydolun
					</button>
				</div>
			</div>
		</div>
	);
}

export default Login;
