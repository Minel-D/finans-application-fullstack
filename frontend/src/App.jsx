import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
	const [harcamalar, setHarcamalar] = useState([]);

	const [yeniHarcama, setYeniHarcama] = useState({
		aciklama: "",
		miktar: "",
		kategori: "Genel",
		tarih: "",
	});

	const [duzenlenenId, setDuzenlenenId] = useState(null);

	useEffect(() => {
		fetchHarcamalar();
	}, []);

	const fetchHarcamalar = async () => {
		try {
			const response = await fetch("http://127.0.0.1:8000/harcamalar/"); // Render'a geçince burası değişecek
			const data = await response.json();
			setHarcamalar(data);
		} catch (error) {
			console.error("Hata:", error);
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
			let response;
			if (duzenlenenId) {
				response = await fetch(
					`http://127.0.0.1:8000/harcamalar/${duzenlenenId}`,
					{
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(veri),
					}
				);
			} else {
				response = await fetch("http://127.0.0.1:8000/harcamalar/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(veri),
				});
			}

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
				});
				if (response.ok) {
					setHarcamalar(harcamalar.filter((h) => h.id !== id));
				}
			} catch (error) {
				console.error(error);
			}
		}
	};

	return (
		<div className="container mt-5">
			<h1 className="text-center mb-4 display-4 text-primary">
				💰 Finans Takip
			</h1>

			<div className="row">
				{/* --- FORM ALANI (SOL TARAFA ALDIK) --- */}
				<div className="col-md-4">
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

				{/* --- TABLO ALANI (SAĞ TARAFA ALDIK) --- */}
				<div className="col-md-8">
					<div className="card shadow">
						<div className="card-body">
							<table className="table table-hover table-striped">
								<thead className="table-dark">
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

export default App;
