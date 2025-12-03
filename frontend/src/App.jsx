import { useState, useEffect } from "react";

function App() {
	const [harcamalar, setHarcamalar] = useState([]);

	const [yeniHarcama, setYeniHarcama] = useState({
		aciklama: "",
		miktar: "",
		kategori: "Genel",
		tarih: "",
	});

	// --- YENİ STATE: DÜZENLEME MODU ---
	// Eğer bu null ise: "Ekleme Modundayız"
	// Eğer içinde sayı varsa (örn: 5): "5 numaralı ID'yi düzenliyoruz"
	const [duzenlenenId, setDuzenlenenId] = useState(null);

	useEffect(() => {
		fetchHarcamalar();
	}, []);

	const fetchHarcamalar = async () => {
		try {
			const response = await fetch("http://127.0.0.1:8000/harcamalar/");
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

	// --- BUTONA BASILINCA (HEM EKLEME HEM GÜNCELLEME) ---
	const handleFormSubmit = async (e) => {
		e.preventDefault();
		const veri = { ...yeniHarcama, miktar: parseFloat(yeniHarcama.miktar) };

		try {
			let response;

			// KARAR ANI: Ekleme mi yapıyoruz, Güncelleme mi?
			if (duzenlenenId) {
				// --- GÜNCELLEME (PUT) ---
				response = await fetch(
					`http://127.0.0.1:8000/harcamalar/${duzenlenenId}`,
					{
						method: "PUT", // Metod PUT oldu
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(veri),
					}
				);
			} else {
				// --- EKLEME (POST) ---
				response = await fetch("http://127.0.0.1:8000/harcamalar/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(veri),
				});
			}

			if (response.ok) {
				fetchHarcamalar(); // Listeyi yenile
				// Formu temizle ve düzenleme modundan çık
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

	// --- DÜZENLE BUTONUNA BASILINCA ---
	const handleDuzenleSec = (harcama) => {
		// 1. Düzenlenecek ID'yi hafızaya al
		setDuzenlenenId(harcama.id);
		// 2. O satırdaki verileri forma geri doldur (Pre-fill)
		setYeniHarcama({
			aciklama: harcama.aciklama,
			miktar: harcama.miktar,
			kategori: harcama.kategori,
			tarih: harcama.tarih,
		});
	};

	// --- VAZGEÇ BUTONU İÇİN ---
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
		<div
			style={{
				padding: "20px",
				fontFamily: "Arial",
				maxWidth: "800px",
				margin: "0 auto",
			}}>
			<h1>💰 Finans Takip Uygulaması</h1>

			{/* Form Alanı */}
			<div
				style={{
					background: duzenlenenId ? "#fff3cd" : "#f4f4f4",
					padding: "15px",
					marginBottom: "20px",
					borderRadius: "8px",
					border: duzenlenenId ? "2px solid orange" : "none",
				}}>
				<h3>
					{duzenlenenId ? "✏️ Harcamayı Düzenle" : "➕ Yeni Harcama Ekle"}
				</h3>

				<form
					onSubmit={handleFormSubmit}
					style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
					<input
						type="text"
						name="aciklama"
						placeholder="Açıklama"
						value={yeniHarcama.aciklama}
						onChange={handleInputChange}
						required
					/>
					<input
						type="number"
						name="miktar"
						placeholder="Tutar"
						value={yeniHarcama.miktar}
						onChange={handleInputChange}
						required
					/>
					<select
						name="kategori"
						value={yeniHarcama.kategori}
						onChange={handleInputChange}>
						<option value="Genel">Genel</option>
						<option value="Gıda">Gıda</option>
						<option value="Ulaşım">Ulaşım</option>
						<option value="Eğlence">Eğlence</option>
						<option value="Yatırım">Yatırım</option>
					</select>
					<input
						type="date"
						name="tarih"
						value={yeniHarcama.tarih}
						onChange={handleInputChange}
						required
					/>

					{/* Buton Dinamikleşti */}
					<button
						type="submit"
						style={{
							background: duzenlenenId ? "orange" : "green",
							color: "white",
							border: "none",
							padding: "10px",
							cursor: "pointer",
							borderRadius: "4px",
						}}>
						{duzenlenenId ? "GÜNCELLE" : "EKLE"}
					</button>

					{/* Düzenleme Modundaysak İptal Butonu Çıksın */}
					{duzenlenenId && (
						<button
							type="button"
							onClick={handleIptal}
							style={{
								background: "gray",
								color: "white",
								border: "none",
								padding: "10px",
								cursor: "pointer",
								borderRadius: "4px",
							}}>
							İPTAL
						</button>
					)}
				</form>
			</div>

			<table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr style={{ backgroundColor: "#333", color: "white" }}>
						<th>ID</th>
						<th>Açıklama</th>
						<th>Miktar (TL)</th>
						<th>Kategori</th>
						<th>Tarih</th>
						<th>İşlemler</th>
					</tr>
				</thead>
				<tbody>
					{harcamalar.map((harcama) => (
						<tr
							key={harcama.id}
							style={{
								backgroundColor:
									duzenlenenId === harcama.id ? "#fff3cd" : "white",
							}}>
							<td>{harcama.id}</td>
							<td>{harcama.aciklama}</td>
							<td>{harcama.miktar} ₺</td>
							<td>{harcama.kategori}</td>
							<td>{harcama.tarih}</td>
							<td
								style={{
									textAlign: "center",
									display: "flex",
									gap: "5px",
									justifyContent: "center",
									padding: "5px",
								}}>
								{/* DÜZENLE BUTONU */}
								<button
									onClick={() => handleDuzenleSec(harcama)}
									style={{
										background: "orange",
										color: "white",
										border: "none",
										padding: "5px 10px",
										cursor: "pointer",
										borderRadius: "4px",
									}}>
									Düzenle ✏️
								</button>
								{/* SİL BUTONU */}
								<button
									onClick={() => handleSil(harcama.id)}
									style={{
										background: "red",
										color: "white",
										border: "none",
										padding: "5px 10px",
										cursor: "pointer",
										borderRadius: "4px",
									}}>
									Sil 🗑️
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default App;
