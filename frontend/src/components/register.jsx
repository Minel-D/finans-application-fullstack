import { useState } from "react";
import { useNavigate } from "react-router-dom";
// API importu
import { register } from "../api";

// İkonlar (BsExclamationTriangleFill EKLENDİ)
import {
	BsPerson,
	BsEnvelope,
	BsLock,
	BsCheckCircleFill,
	BsEye,
	BsEyeSlash,
	BsArrowLeft,
	BsExclamationTriangleFill, // <--- Uyarı ikonu buraya eklendi
} from "react-icons/bs";

function Register() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	// Şifre Göster/Gizle State'i
	const [showPassword, setShowPassword] = useState(false);

	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleRegister = async (e) => {
		e.preventDefault();
		setError("");
		setMessage("");

		try {
			const data = await register(username, email, password);
			if (data.id) {
				setMessage("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
				setTimeout(() => navigate("/login"), 2000);
			} else {
				setError("Kayıt başarısız oldu.");
			}
		} catch (err) {
			setError("Kayıt sırasında bir hata oluştu.");
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
			{/* --- ANA SAYFA BUTONU --- */}
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
				<div className="text-center mb-3">
					<h2
						className="fw-bold"
						style={{
							fontFamily: "'Dancing Script', cursive",
							color: "#1e3c72",
							fontSize: "2.5rem",
						}}>
						Aramıza Katılın!
					</h2>
					<p className="text-muted small">Finansal özgürlüğe ilk adımı atın!</p>
				</div>

				{/* --- ⚠️ KRİTİK UYARI NOTU (REGISTER İÇİN UYARLANDI) --- */}
				<div
					className="alert alert-warning border-0 shadow-sm d-flex align-items-start gap-2 p-2 mb-4"
					style={{ fontSize: "0.85rem", borderRadius: "10px" }}>
					<BsExclamationTriangleFill className="mt-1 flex-shrink-0" size={16} />
					<div>
						<strong>Demo Notu:</strong> Render Free Tier sunucusu kullanıldığı
						için kayıt işlemi sunucunun uyanmasına bağlı olarak{" "}
						<strong>~60 saniye</strong> sürebilir. Lütfen bekleyiniz. ⏳
					</div>
				</div>

				{message && (
					<div className="alert alert-success text-center py-2 small">
						{message}
					</div>
				)}
				{error && (
					<div className="alert alert-danger text-center py-2 small">
						{error}
					</div>
				)}

				<form onSubmit={handleRegister}>
					{/* Kullanıcı Adı */}
					<div className="mb-3">
						<label className="form-label small fw-bold text-secondary">
							Kullanıcı Adı
						</label>
						<div className="input-group">
							<span className="input-group-text bg-white border-end-0 text-primary">
								<BsPerson />
							</span>
							<input
								type="text"
								className="form-control border-start-0 ps-0"
								placeholder="Adınız"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								style={{ boxShadow: "none" }}
							/>
						</div>
					</div>

					{/* Email */}
					<div className="mb-3">
						<label className="form-label small fw-bold text-secondary">
							E-Posta
						</label>
						<div className="input-group">
							<span className="input-group-text bg-white border-end-0 text-primary">
								<BsEnvelope />
							</span>
							<input
								type="email"
								className="form-control border-start-0 ps-0"
								placeholder="mail@ornek.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								style={{ boxShadow: "none" }}
							/>
						</div>
					</div>

					{/* Şifre (GÖZ İKONLU) */}
					<div className="mb-4">
						<label className="form-label small fw-bold text-secondary">
							Şifre
						</label>
						<div className="input-group">
							<span className="input-group-text bg-white border-end-0 text-primary">
								<BsLock />
							</span>
							<input
								type={showPassword ? "text" : "password"}
								className="form-control border-start-0 border-end-0 ps-0"
								placeholder="Güçlü bir şifre seçin"
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
						Ücretsiz Kaydol <BsCheckCircleFill className="ms-2" />
					</button>
				</form>

				<div className="text-center mt-4 pt-3 border-top">
					<p className="small text-muted mb-0">Zaten hesabınız var mı?</p>
					<button
						onClick={() => navigate("/login")}
						className="btn btn-link text-decoration-none fw-bold"
						style={{ color: "#1e3c72" }}>
						Giriş Yap
					</button>
				</div>
			</div>
		</div>
	);
}

export default Register;
