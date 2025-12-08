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

	// --- YENİ EKLENEN AI STATE'LERİ ---
	const [aiYorum, setAiYorum] = useState(""); // AI'dan gelen cevap burada duracak
	const [loading, setLoading] = useState(false); // Yükleniyor mu? (Spinner için)

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

	// --- YENİ: AI ANALİZ FONKSİYONU ---
	const handleAnaliz = async () => {
		setLoading(true); // Yükleniyor'u başlat
		setAiYorum(""); // Önceki yorumu temizle

		try {
			const response = await fetch("http://127.0.0.1:8000/analyze/", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			setAiYorum(data.analiz); // Cevabı ekrana bas
		} catch (error) {
			console.error("AI Hatası:", error);
			setAiYorum("Bir hata oluştu. Lütfen tekrar deneyin.");
		} finally {
			setLoading(false); // Yükleniyor'u durdur
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
		<div className="container mt-5 mb-5">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h1 className="display-4 text-primary">💰 Finans Takip</h1>
				<button onClick={handleLogout} className="btn btn-outline-danger">
					Çıkış Yap 🚪
				</button>
			</div>

			<div className="row mb-4">
				{/* SOL TARAFA FORM */}
				<div className="col-md-5">
					<div
						className={`card shadow ${
							duzenlenenId ? "border-warning" : "border-success"
						}`}>
						<div
							className={`card-header text-white ${
								duzenlenenId ? "bg-warning" : "bg-success"
							}`}>
							<h5 className="mb-0">
								{duzenlenenId ? "✏️ Düzenle" : "➕ Yeni Ekle"}
							</h5>
						</div>
						<div className="card-body">
							<form onSubmit={handleFormSubmit}>
								<div className="mb-3">
									<label className="form-label">Açıklama</label>
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
									<label className="form-label">Tutar (TL)</label>
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
									<label className="form-label">Kategori</label>
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
								<div className="mb-3">
									<label className="form-label">Tarih</label>
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

				{/* SAĞ TARAF (GRAFİK + AI KUTUSU) */}
				<div className="col-md-7">
					{/* GRAFİK */}
					<HarcamaGrafik veriler={harcamalar} />

					{/* --- AI ANALİZ KUTUSU --- */}
					<div className="card shadow mt-4 border-info">
						<div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
							<h5 className="mb-0">🤖 Yapay Zeka Analizi</h5>
							<button
								onClick={handleAnaliz}
								className="btn btn-light btn-sm"
								disabled={loading}>
								{loading ? (
									<span>
										<span className="spinner-border spinner-border-sm me-2"></span>{" "}
										Düşünüyor...
									</span>
								) : (
									"✨ Yorumla"
								)}
							</button>
						</div>
						<div className="card-body bg-light">
							{aiYorum ? (
								<p style={{ whiteSpace: "pre-line" }}>{aiYorum}</p>
							) : (
								<p className="text-muted text-center mb-0">
									Harcamalarınızı yapay zekaya yorumlatmak için yukarıdaki
									butona basın.
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="row">
				<div className="col-12">
					<div className="card shadow">
						<div className="card-header bg-dark text-white">
							<h5 className="mb-0">📋 Harcama Listesi</h5>
						</div>
						<div className="card-body">
							<table className="table table-hover table-striped">
								<thead className="table-light">
									<tr>
										<th>Açıklama</th>
										<th>Miktar</th>
										<th>Kategori</th>
										<th>Tarih</th>
										<th>İşlem</th>
									</tr>
								</thead>
								<tbody>
									{harcamalar.map((harcama) => (
										<tr
											key={harcama.id}
											className={
												duzenlenenId === harcama.id ? "table-warning" : ""
											}>
											<td>{harcama.aciklama}</td>
											<td>
												<span className="badge bg-info text-dark fs-6">
													{harcama.miktar} ₺
												</span>
											</td>
											<td>{harcama.kategori}</td>
											<td>{harcama.tarih}</td>
											<td>
												<div className="btn-group" role="group">
													<button
														onClick={() => handleDuzenleSec(harcama)}
														className="btn btn-sm btn-outline-warning">
														✏️
													</button>
													<button
														onClick={() => handleSil(harcama.id)}
														className="btn btn-sm btn-outline-danger">
														🗑️
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{harcamalar.length === 0 && (
								<p className="text-center mt-3 text-muted">
									Henüz harcama yok.
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
