import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HarcamaGrafik from "./HarcamaGrafik";

function Dashboard() {
	const [harcamalar, setHarcamalar] = useState([]);
	const navigate = useNavigate();

	const [yeniHarcama, setYeniHarcama] = useState({
		aciklama: "",
		miktar: "",
		kategori: "Genel",
		tarih: "",
	});

	const [duzenlenenId, setDuzenlenenId] = useState(null);

	// --- STATE'LER ---
	const [aiYorum, setAiYorum] = useState("");
	const [loading, setLoading] = useState(false);
	const [showAiPanel, setShowAiPanel] = useState(false);
	const [showMenu, setShowMenu] = useState(false);

	const token = localStorage.getItem("token");

	useEffect(() => {
		if (!token) {
			navigate("/login");
		} else {
			fetchHarcamalar();
		}
	}, []);

	const fetchHarcamalar = async () => {
		try {
			const response = await fetch("http://127.0.0.1:8000/harcamalar/", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.status === 401) {
				handleLogout();
				return;
			}
			const data = await response.json();
			setHarcamalar(data);
		} catch (error) {
			console.error("Hata:", error);
		}
	};

	const handleAnaliz = async () => {
		setShowAiPanel(true);
		setLoading(true);
		setAiYorum("");

		try {
			const response = await fetch("http://127.0.0.1:8000/analyze/", {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = await response.json();
			setAiYorum(data.analiz);
		} catch (error) {
			setAiYorum("Bir hata oluştu. Tekrar deneyin.");
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setYeniHarcama({ ...yeniHarcama, [name]: value });
	};

	const handleFormSubmit = async (e) => {
		e.preventDefault();
		const veri = { ...yeniHarcama, miktar: parseFloat(yeniHarcama.miktar) };

		try {
			const url = duzenlenenId
				? `http://127.0.0.1:8000/harcamalar/${duzenlenenId}`
				: "http://127.0.0.1:8000/harcamalar/";

			const method = duzenlenenId ? "PUT" : "POST";

			const response = await fetch(url, {
				method: method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(veri),
			});

			if (response.ok) {
				fetchHarcamalar();
				setYeniHarcama({
					aciklama: "",
					miktar: "",
					kategori: "Genel",
					tarih: "",
				});
				setDuzenlenenId(null);
			} else {
				alert("İşlem başarısız!");
			}
		} catch (error) {
			console.error("Hata:", error);
		}
	};

	const handleDuzenleSec = (harcama) => {
		setDuzenlenenId(harcama.id);
		setYeniHarcama({
			aciklama: harcama.aciklama,
			miktar: harcama.miktar,
			kategori: harcama.kategori,
			tarih: harcama.tarih,
		});
	};

	const handleIptal = () => {
		setDuzenlenenId(null);
		setYeniHarcama({ aciklama: "", miktar: "", kategori: "Genel", tarih: "" });
	};

	const handleSil = async (id) => {
		if (window.confirm("Silmek istediğine emin misin?")) {
			try {
				const response = await fetch(`http://127.0.0.1:8000/harcamalar/${id}`, {
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				});
				if (response.ok) {
					setHarcamalar(harcamalar.filter((h) => h.id !== id));
				}
			} catch (error) {
				console.error(error);
			}
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/login");
	};

	return (
		<div style={{ position: "relative", minHeight: "100vh" }}>
			{/* --- ARKA PLAN RESMİ (SABİT VE ŞEFFAF) --- */}
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
					opacity: 0.3,
					zIndex: -1,
				}}></div>

			{/* --- ÜST MENÜ BAR (NAVBAR) - BEYAZ VE NET --- */}
			<nav
				className="navbar navbar-light bg-white shadow-sm mb-4 px-4 py-3 sticky-top"
				style={{ zIndex: 1000, position: "relative" }}>
				<div className="d-flex align-items-center">
					<button
						className="btn btn-light border me-3"
						onClick={() => setShowMenu(true)}
						style={{ fontSize: "1.2rem", padding: "5px 12px" }}>
						☰
					</button>
					<h1
						className="h3 mb-0 text-primary fw-bold"
						style={{ letterSpacing: "-1px" }}>
						💰 Finans Takip
					</h1>
				</div>

				<button
					onClick={handleAnaliz}
					className="btn btn-primary btn-sm px-3 shadow-sm rounded-pill">
					✨ AI Analiz
				</button>
			</nav>

			<div className="container" style={{ position: "relative", zIndex: 1 }}>
				<div className="row mb-4">
					{/* SOL: FORM */}
					<div className="col-md-4 mb-3">
						<div className={`card shadow-sm border-0 h-100 bg-white`}>
							<div
								className={`card-header text-white fw-bold ${
									duzenlenenId ? "bg-warning" : "bg-success"
								}`}>
								{duzenlenenId ? "✏️ Harcama Düzenle" : "➕ Yeni Ekle"}
							</div>
							<div className="card-body">
								<form onSubmit={handleFormSubmit}>
									<div className="mb-3">
										<label className="form-label text-muted small">
											Açıklama
										</label>
										<input
											type="text"
											className="form-control"
											name="aciklama"
											value={yeniHarcama.aciklama}
											onChange={handleInputChange}
											required
										/>
									</div>
									<div className="mb-3">
										<label className="form-label text-muted small">
											Tutar (TL)
										</label>
										<input
											type="number"
											className="form-control"
											name="miktar"
											value={yeniHarcama.miktar}
											onChange={handleInputChange}
											required
										/>
									</div>
									<div className="mb-3">
										<label className="form-label text-muted small">
											Kategori
										</label>
										<select
											className="form-select"
											name="kategori"
											value={yeniHarcama.kategori}
											onChange={handleInputChange}>
											<option value="Genel">Genel</option>
											<option value="Gıda">Gıda</option>
											<option value="Ulaşım">Ulaşım</option>
											<option value="Eğlence">Eğlence</option>
											<option value="Yatırım">Yatırım</option>
										</select>
									</div>
									<div className="mb-4">
										<label className="form-label text-muted small">Tarih</label>
										<input
											type="date"
											className="form-control"
											name="tarih"
											value={yeniHarcama.tarih}
											onChange={handleInputChange}
											required
										/>
									</div>

									<div className="d-grid gap-2">
										<button
											type="submit"
											className={`btn ${
												duzenlenenId ? "btn-warning text-white" : "btn-success"
											}`}>
											{duzenlenenId ? "GÜNCELLE" : "EKLE"}
										</button>
										{duzenlenenId && (
											<button
												type="button"
												onClick={handleIptal}
												className="btn btn-secondary">
												İPTAL
											</button>
										)}
									</div>
								</form>
							</div>
						</div>
					</div>

					{/* SAĞ: GRAFİK */}
					<div className="col-md-8 mb-3">
						<div className="card shadow-sm border-0 h-100 bg-white">
							<div className="card-header bg-white border-bottom-0 pt-3">
								<h5 className="text-muted mb-0 small text-uppercase fw-bold">
									📊 Harcama Dağılımı
								</h5>
							</div>
							<div className="card-body d-flex align-items-center justify-content-center">
								<HarcamaGrafik veriler={harcamalar} />
							</div>
						</div>
					</div>
				</div>

				{/* TABLO */}
				<div className="row">
					<div className="col-12" style={{ marginBottom: "30px" }}>
						<div className="card shadow-sm border-0 bg-white">
							<div className="card-header bg-white py-3">
								<h5 className="mb-0 text-primary fw-bold">📋 Son Harcamalar</h5>
							</div>
							<div className="card-body p-0">
								<div className="table-responsive">
									<table className="table table-hover table-striped mb-0 align-middle">
										<thead className="table-light">
											<tr>
												<th className="ps-4">Açıklama</th>
												<th>Miktar</th>
												<th>Kategori</th>
												<th>Tarih</th>
												<th className="text-end pe-4">İşlem</th>
											</tr>
										</thead>
										<tbody>
											{harcamalar.map((harcama) => (
												<tr
													key={harcama.id}
													className={
														duzenlenenId === harcama.id ? "table-warning" : ""
													}>
													<td className="ps-4 fw-medium">{harcama.aciklama}</td>
													<td>
														<span className="badge bg-soft-primary text-primary border border-primary bg-opacity-10">
															{harcama.miktar} ₺
														</span>
													</td>
													<td>{harcama.kategori}</td>
													<td>{harcama.tarih}</td>
													<td className="text-end pe-4">
														<div className="btn-group" role="group">
															<button
																onClick={() => handleDuzenleSec(harcama)}
																className="btn btn-sm btn-outline-warning"
																title="Düzenle">
																✏️
															</button>
															<button
																onClick={() => handleSil(harcama.id)}
																className="btn btn-sm btn-outline-danger"
																title="Sil">
																🗑️
															</button>
														</div>
													</td>
												</tr>
											))}
											{harcamalar.length === 0 && (
												<tr>
													<td
														colSpan="5"
														className="text-center py-5 text-muted">
														Henüz harcama kaydı yok.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* --- SOL MENÜ (HAMBURGER SIDEBAR) --- */}
			<div
				className={`offcanvas offcanvas-start ${showMenu ? "show" : ""}`}
				tabIndex="-1"
				style={{
					visibility: showMenu ? "visible" : "hidden",
					width: "280px",
					zIndex: 1055, // En üste aldık
					position: "fixed",
					top: 0,
					bottom: 0,
					left: 0,
					backgroundColor: "white",
					boxShadow: "5px 0 15px rgba(0,0,0,0.1)",
				}}>
				<div className="offcanvas-header bg-light border-bottom">
					<h5 className="offcanvas-title text-primary fw-bold">💰 Menü</h5>
					<button
						type="button"
						className="btn-close text-reset"
						onClick={() => setShowMenu(false)}></button>
				</div>
				<div className="offcanvas-body p-0">
					<div className="list-group list-group-flush">
						<button className="list-group-item list-group-item-action py-3 border-0 d-flex align-items-center">
							<span className="me-3">👤</span> Profilim{" "}
							<span className="badge bg-secondary ms-auto small">Yakında</span>
						</button>
						<button className="list-group-item list-group-item-action py-3 border-0 d-flex align-items-center">
							<span className="me-3">⚙️</span> Ayarlar{" "}
							<span className="badge bg-secondary ms-auto small">Yakında</span>
						</button>
						<button
							onClick={handleLogout}
							className="list-group-item list-group-item-action py-3 border-0 text-danger fw-bold d-flex align-items-center mt-2 border-top">
							<span className="me-3">🚪</span> Çıkış Yap
						</button>
					</div>
				</div>
				<div className="offcanvas-footer p-3 bg-light text-center small text-muted">
					v1.0.0 - Finans Takip
				</div>
			</div>

			{/* --- SAĞ PANEL (AI SIDEBAR) --- */}
			<div
				className={`offcanvas offcanvas-end ${showAiPanel ? "show" : ""}`}
				tabIndex="-1"
				style={{
					visibility: showAiPanel ? "visible" : "hidden",
					width: "400px",
					zIndex: 1055, // En üste aldık
					position: "fixed",
					top: 10,
					bottom: 10,
					right: 5,
					borderRadius: "8px",
					backgroundColor: "white",
					boxShadow: "-5px 0 15px rgba(0,0,0,0.1)",
				}}>
				<div
					className="offcanvas-header bg-primary text-white"
					style={{
						borderTopLeftRadius: "8px",
						borderTopRightRadius: "8px",
					}}>
					<h5 className="offcanvas-title">🤖 Yapay Zeka Tavsiyesi</h5>
					<button
						type="button"
						className="btn-close btn-close-white"
						onClick={() => setShowAiPanel(false)}></button>
				</div>
				<div className="offcanvas-body" style={{ overflowY: "auto" }}>
					{loading ? (
						<div className="text-center mt-5">
							<div className="spinner-border text-primary" role="status"></div>
							<p className="mt-3 text-muted">Harcamaların inceleniyor...</p>
						</div>
					) : (
						<div className="p-3">
							<p
								style={{
									whiteSpace: "pre-line",
									lineHeight: "1.8",
									fontSize: "1rem",
									color: "#333",
								}}>
								{aiYorum || "Analiz bekleniyor..."}
							</p>
						</div>
					)}
				</div>
			</div>

			{/* ORTAK ARKA PLAN KARARTISI (BACKDROP) */}
			{(showMenu || showAiPanel) && (
				<div
					className="modal-backdrop fade show"
					onClick={() => {
						setShowMenu(false);
						setShowAiPanel(false);
					}}
					style={{ zIndex: 1040 }} // Panelin altında kalacak
				></div>
			)}
		</div>
	);
}

export default Dashboard;
