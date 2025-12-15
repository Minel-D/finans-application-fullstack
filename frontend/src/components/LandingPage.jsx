import React from "react";
import { useNavigate } from "react-router-dom";
// İkonları import ediyoruz (Bootstrap Icons paketi)
import { BsGraphUpArrow, BsRobot, BsShieldLockFill } from "react-icons/bs";

const LandingPage = () => {
	const navigate = useNavigate();

	// --- STİL AYARLARI ---
	const styles = {
		logoFont: { fontFamily: "'Dancing Script', cursive" },
		bodyFont: { fontFamily: "'Libre Baskerville', serif" },
		aiTextFont: {
			fontFamily: "'Playfair Display', serif",
			fontWeight: "800",
			fontStyle: "italic",
		},
		navLink: {
			textDecoration: "none",
			color: "#334155",
			fontWeight: "bold",
			fontSize: "1rem",
			cursor: "pointer",
			transition: "color 0.2s",
		},
		// İkonlar için ortak stil
		iconStyle: {
			fontSize: "2.5rem",
			color: "#1e3c72", // Marka rengi (Lacivert)
			marginBottom: "1rem",
		},
	};

	return (
		<div
			style={{
				...styles.bodyFont,
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
			}}>
			{/* 1. HEADER (NAVBAR) */}
			<nav
				className="navbar navbar-expand-lg px-4 py-3 sticky-top"
				style={{
					backgroundColor: "#fff",
					borderBottom: "1px solid #e2e8f0",
					zIndex: 1000,
				}}>
				<div className="container">
					{/* Logo */}
					<span
						className="navbar-brand fw-bold"
						style={{
							...styles.logoFont,
							fontSize: "1.8rem",
							background: "linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
							cursor: "pointer",
						}}
						onClick={() => navigate("/")}>
						FinanceAgent AI
					</span>

					{/* Menü Linkleri */}
					<div className="d-none d-md-flex gap-4 align-items-center">
						<a href="#" style={styles.navLink}>
							Ana Sayfa
						</a>
						<a href="#features" style={styles.navLink}>
							Özellikler
						</a>
						<a href="#pricing" style={styles.navLink}>
							Fiyatlandırma
						</a>
					</div>

					{/* Butonlar */}
					<div className="d-flex gap-2">
						<button
							onClick={() => navigate("/login")}
							className="btn btn-outline-primary fw-bold px-4 rounded-pill"
							style={{ borderWidth: "2px" }}>
							Giriş Yap
						</button>
						<button
							onClick={() => navigate("/register")}
							className="btn btn-primary fw-bold px-4 rounded-pill shadow-sm"
							style={{
								background: "linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)",
								border: "none",
							}}>
							Kayıt Ol
						</button>
					</div>
				</div>
			</nav>

			{/* 2. ORTA KISIM (MAIN CONTENT) */}
			<main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
				{/* --- ARKA PLAN RESMİ --- */}
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
						backgroundRepeat: "no-repeat",
						opacity: 0.5,
						zIndex: -1,
						pointerEvents: "none",
					}}></div>

				{/* --- HERO SECTION --- */}
				<div
					className="container text-center d-flex flex-column justify-content-center align-items-center mt-5"
					style={{ minHeight: "80vh", position: "relative" }}>
					<div
						className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill border border-primary fw-bold"
						style={{ fontSize: "0.9rem" }}>
						Geleceğin Finans Yönetimi
					</div>

					<h1
						className="display-3 fw-bold mb-4"
						style={{ color: "#1e3c72", letterSpacing: "-1px" }}>
						Finansal Özgürlüğe <br />
						<span
							style={{
								...styles.aiTextFont,
								color: "#2a5298",
								fontSize: "1.1em",
							}}>
							Yapay Zeka
						</span>{" "}
						ile Ulaşın
					</h1>

					<p
						className="lead text-muted mb-5"
						style={{
							maxWidth: "700px",
							fontSize: "1.25rem",
							fontWeight: "500",
						}}>
						Harcamalarınızı takip edin, bütçenizi optimize edin ve
						<span className="fw-bold text-dark"> FinanceAgent AI</span>'ın size
						özel sunduğu akıllı analizlerle paranızı yönetin.
					</p>

					<div className="d-flex gap-3">
						<button
							onClick={() => navigate("/register")}
							className="btn btn-lg btn-primary px-5 py-3 rounded-pill shadow-lg fw-bold"
							style={{
								fontSize: "1.2rem",
								background: "linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)",
								border: "none",
								transition: "transform 0.2s",
							}}
							onMouseOver={(e) =>
								(e.currentTarget.style.transform = "scale(1.05)")
							}
							onMouseOut={(e) =>
								(e.currentTarget.style.transform = "scale(1)")
							}>
							Hemen Başla
						</button>
						<button
							className="btn btn-lg btn-light px-5 py-3 rounded-pill border fw-bold text-muted"
							onClick={() =>
								document
									.getElementById("features")
									.scrollIntoView({ behavior: "smooth" })
							}>
							Daha Fazla Bilgi
						</button>
					</div>

					{/* --- ÖZELLİKLER KARTLARI (İKONLAR EKLENDİ) --- */}
					<div id="features" className="row mt-5 pt-5 g-4 w-100 pb-5">
						{/* KART 1: Detaylı Takip */}
						<div className="col-md-4">
							<div className="p-4 bg-white rounded-4 shadow-sm h-100 border-0 feature-card">
								{/* İKON: Grafik */}
								<div style={styles.iconStyle}>
									<BsGraphUpArrow />
								</div>
								<h3 className="h5 fw-bold text-dark">Detaylı Takip</h3>
								<p className="text-muted small">
									Gelir ve giderlerinizi kategorilere ayırın, paranızın nereye
									gittiğini anlık grafiklerle görün.
								</p>
							</div>
						</div>

						{/* KART 2: Yapay Zeka */}
						<div className="col-md-4">
							<div
								className="p-4 bg-white rounded-4 shadow-sm h-100 border-0 feature-card"
								style={{ borderTop: "4px solid #1e3c72" }}>
								{/* İKON: Robot */}
								<div style={styles.iconStyle}>
									<BsRobot />
								</div>
								<h3 className="h5 fw-bold">Yapay Zeka Analizi</h3>
								<p className="text-muted small">
									Yapay zeka asistanınız harcamalarınızı analiz eder ve tasarruf
									edebileceğiniz noktaları size söyler.
								</p>
							</div>
						</div>

						{/* KART 3: Güvenlik */}
						<div className="col-md-4">
							<div className="p-4 bg-white rounded-4 shadow-sm h-100 border-0 feature-card">
								{/* İKON: Kilit */}
								<div style={styles.iconStyle}>
									<BsShieldLockFill />
								</div>
								<h3 className="h5 fw-bold text-dark">Güvenli Veri</h3>
								<p className="text-muted small">
									Verileriniz modern şifreleme yöntemleriyle (AES-256) korunur.
									Sadece siz erişebilirsiniz.
								</p>
							</div>
						</div>
					</div>
				</div>
			</main>

			{/* 3. FOOTER */}
			<footer
				style={{
					backgroundColor: "#0f172a",
					color: "#94a3b8",
					paddingTop: "4rem",
					paddingBottom: "2rem",
				}}>
				<div className="container">
					<div className="row g-4">
						<div className="col-md-4 text-start">
							<h5 className="text-white fw-bold mb-3" style={styles.logoFont}>
								FinanceAgent AI
							</h5>
							<p className="small">
								Yapay zeka destekli kişisel finans asistanınız. Geleceğinizi
								inşa etmenize yardımcı oluyoruz.
							</p>
						</div>
						<div className="col-md-2 offset-md-1 text-start">
							<h6 className="text-white fw-bold mb-3">Ürün</h6>
							<ul className="list-unstyled d-flex flex-column gap-2 small">
								<li>
									<a href="#" className="text-decoration-none text-reset">
										Özellikler
									</a>
								</li>
								<li>
									<a href="#" className="text-decoration-none text-reset">
										Fiyatlandırma
									</a>
								</li>
								<li>
									<a href="#" className="text-decoration-none text-reset">
										Güvenlik
									</a>
								</li>
							</ul>
						</div>
						<div className="col-md-2 text-start">
							<h6 className="text-white fw-bold mb-3">Şirket</h6>
							<ul className="list-unstyled d-flex flex-column gap-2 small">
								<li>
									<a href="#" className="text-decoration-none text-reset">
										Hakkımızda
									</a>
								</li>
								<li>
									<a href="#" className="text-decoration-none text-reset">
										Kariyer
									</a>
								</li>
								<li>
									<a href="#" className="text-decoration-none text-reset">
										İletişim
									</a>
								</li>
							</ul>
						</div>
						<div className="col-md-3 text-start">
							<h6 className="text-white fw-bold mb-3">Haberdar Olun</h6>
							<div className="input-group mb-3">
								<input
									type="text"
									className="form-control form-control-sm"
									placeholder="E-posta adresiniz"
								/>
								<button className="btn btn-primary btn-sm" type="button">
									Kayıt
								</button>
							</div>
						</div>
					</div>
					<hr className="my-4" style={{ borderColor: "#334155" }} />
					<div className="text-center small">
						&copy; {new Date().getFullYear()} FinanceAgent AI. Tüm hakları
						saklıdır.
					</div>
				</div>
			</footer>
		</div>
	);
};

export default LandingPage;
