import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	BsArrowLeft,
	BsMoonStars,
	BsGlobe,
	BsTrash,
	BsSun,
} from "react-icons/bs";

const Settings = () => {
	const navigate = useNavigate();

	const [darkMode, setDarkMode] = useState(() => {
		return localStorage.getItem("theme") === "dark";
	});
	const [currency, setCurrency] = useState(() => {
		return localStorage.getItem("currency") || "TRY";
	});

	const toggleDarkMode = () => {
		const newVal = !darkMode;
		setDarkMode(newVal);
		localStorage.setItem("theme", newVal ? "dark" : "light");
	};

	const handleCurrencyChange = (e) => {
		const newVal = e.target.value;
		setCurrency(newVal);
		localStorage.setItem("currency", newVal);
	};

	const handleDeleteAccount = () => {
		if (window.confirm("Bu işlem geri alınamaz! Hesabınız silinsin mi?")) {
			alert("Hesap silme fonksiyonu yakında aktif olacak.");
		}
	};

	return (
		<div
			style={{
				position: "relative",
				minHeight: "100vh",
				fontFamily: "'Libre Baskerville', serif",
			}}>
			{/* --- ARKA PLAN RESMİ --- */}
			<div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					backgroundImage: "url('/finans.webp')",
					backgroundSize: "cover",
					backgroundPosition: "center",
					opacity: 0.5,
					zIndex: -1,
				}}></div>

			{/* --- SOL ÜST BUTON (GÜNCELLENDİ) --- */}
			<button
				onClick={() => navigate("/dashboard")}
				className="btn shadow-sm rounded-pill px-4 py-2 fw-bold d-flex align-items-center"
				style={{
					position: "absolute",
					top: "30px",
					left: "30px",
					backgroundColor: "#1e3c72", // Ana Mavi Renk
					color: "white",
					border: "none",
					zIndex: 10,
					fontSize: "0.9rem",
				}}>
				<BsArrowLeft className="me-2" /> Ana Sayfaya Dön
			</button>

			<div
				className="container py-5"
				style={{ maxWidth: "600px", paddingTop: "100px" }}>
				<h4
					className="fw-bold mb-4 p-3 bg-white rounded-4 shadow-sm d-inline-block"
					style={{ color: "#1e3c72" }}>
					⚙️ Uygulama Ayarları
				</h4>

				<div className="card border-0 shadow-sm rounded-4 mb-3 bg-white bg-opacity-90">
					<div className="card-body p-4">
						{/* Tema Ayarı */}
						<div className="d-flex align-items-center justify-content-between mb-4">
							<div className="d-flex align-items-center">
								<div
									className={`p-2 rounded-circle me-3 ${
										darkMode
											? "bg-dark text-white"
											: "bg-warning bg-opacity-25 text-warning"
									}`}>
									{darkMode ? <BsMoonStars /> : <BsSun />}
								</div>
								<div>
									<h6 className="mb-0 fw-bold">Karanlık Mod</h6>
									<small className="text-muted">
										{darkMode ? "Aktif" : "Kapalı"}
									</small>
								</div>
							</div>
							<div className="form-check form-switch">
								<input
									className="form-check-input"
									type="checkbox"
									style={{ width: "3em", height: "1.5em", cursor: "pointer" }}
									checked={darkMode}
									onChange={toggleDarkMode}
								/>
							</div>
						</div>

						<hr className="text-muted opacity-25" />

						{/* Dil / Para Birimi */}
						<div className="d-flex align-items-center justify-content-between">
							<div className="d-flex align-items-center">
								<div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
									<BsGlobe className="text-success" />
								</div>
								<div>
									<h6 className="mb-0 fw-bold">Para Birimi</h6>
									<small className="text-muted">
										Tüm veriler bu birimde gösterilir
									</small>
								</div>
							</div>
							<select
								className="form-select form-select-sm w-auto border-0 bg-light fw-bold shadow-sm"
								value={currency}
								onChange={handleCurrencyChange}>
								<option value="TRY">TRY (₺)</option>
								<option value="USD">USD ($)</option>
								<option value="EUR">EUR (€)</option>
							</select>
						</div>
					</div>
				</div>

				{/* Tehlikeli Bölge */}
				<div className="card border-danger border-opacity-50 shadow-sm rounded-4 bg-white bg-opacity-75">
					<div className="card-body p-4">
						<h6 className="text-danger fw-bold mb-3 d-flex align-items-center">
							<BsTrash className="me-2" /> Tehlikeli Bölge
						</h6>
						<p className="small text-muted mb-3">
							Hesabınızı ve tüm harcama verilerinizi kalıcı olarak siler. Bu
							işlem geri alınamaz.
						</p>
						<button
							onClick={handleDeleteAccount}
							className="btn btn-outline-danger btn-sm w-100 fw-bold">
							Hesabımı Sil
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Settings;
