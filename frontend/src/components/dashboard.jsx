import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// İKON KÜTÜPHANESİ
import {
	BsChatDotsFill,
	BsSendFill,
	BsX,
	BsRobot,
	BsGraphUpArrow,
	BsCalendar3,
	BsPencilSquare,
	BsTrashFill,
	BsPieChartFill,
	BsClockHistory,
	BsCreditCard2FrontFill,
	BsArrowUpShort,
	BsArrowDownShort,
} from "react-icons/bs";
import Markdown from "react-markdown";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
} from "recharts";

function Dashboard() {
	const [tumVeriler, setTumVeriler] = useState([]);
	const [goruntulenenVeriler, setGoruntulenenVeriler] = useState([]);
	const [guncelFiyatlar, setGuncelFiyatlar] = useState({});
	const navigate = useNavigate();

	// TARİH FİLTRESİ KAPALI (BOŞ) BAŞLAR
	const [baslangicTarihi, setBaslangicTarihi] = useState("");
	const [bitisTarihi, setBitisTarihi] = useState("");

	const [islemTuru, setIslemTuru] = useState("gider");

	const [yeniIslem, setYeniIslem] = useState({
		aciklama: "",
		miktar: "",
		adet: "", // Kripto/Altın Adedi
		kategori: "Genel",
		tarih: new Date().toISOString().split("T")[0],
		is_investment: false,
		asset_type: "Altın",
		symbol: "",
		buy_price: "",
	});
	const [duzenlenenId, setDuzenlenenId] = useState(null);

	const [messages, setMessages] = useState([
		{ sender: "bot", text: "Merhaba! Ben Finans Asistanın. 💰" },
	]);
	const [inputMessage, setInputMessage] = useState("");
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [chatLoading, setChatLoading] = useState(false);
	const chatEndRef = useRef(null);
	const textareaRef = useRef(null);
	const [showMenu, setShowMenu] = useState(false);
	const token = localStorage.getItem("token");

	const COLORS_EXPENSE = [
		"#FF8042",
		"#FFBB28",
		"#FF6B6B",
		"#FF4040",
		"#8884d8",
	];
	const COLORS_INVEST = ["#00C49F", "#0088FE", "#FFBB28", "#FF8042", "#82ca9d"];
	const currencyCode = localStorage.getItem("currency") || "TRY";
	const currencySymbol = { TRY: "₺", USD: "$", EUR: "€" }[currencyCode] || "₺";
	const [userInfo, setUserInfo] = useState({
		full_name: "Kullanıcı",
		email: "",
	});

	useEffect(() => {
		if (!token) navigate("/login");
		else fetchVeriler();
	}, []);

	useEffect(() => {
		if (tumVeriler.length > 0) fetchGuncelFiyatlar();
		filtrele(tumVeriler);
	}, [tumVeriler]);

	useEffect(() => {
		filtrele(tumVeriler);
	}, [baslangicTarihi, bitisTarihi]);

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isChatOpen]);

	// Bu fonksiyonu component içine ekle
	const fetchUserInfo = async () => {
		try {
			const response = await fetch(
				"https://finance-tracking-n468.onrender.com/users/me",
				{
					// Eğer endpoint farklıysa /users/ olarak değiştir
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (response.ok) {
				const data = await response.json();
				console.log("Backend'den Gelen Kullanıcı Verisi:", data);
				setUserInfo(data);
			}
		} catch (error) {
			console.error("Kullanıcı bilgisi alınamadı", error);
		}
	};

	// Sayfa açılınca çalışması için useEffect'e ekle
	useEffect(() => {
		if (token) {
			fetchUserInfo(); // <--- BUNU EKLE
			fetchVeriler();
		} else {
			navigate("/login");
		}
	}, []);

	const filtrele = (data) => {
		if (!baslangicTarihi && !bitisTarihi) {
			setGoruntulenenVeriler(data);
			return;
		}
		const filtrelenmis = data.filter((item) => {
			if (baslangicTarihi && item.tarih < baslangicTarihi) return false;
			if (bitisTarihi && item.tarih > bitisTarihi) return false;
			return true;
		});
		setGoruntulenenVeriler(filtrelenmis);
	};

	const fetchVeriler = async () => {
		try {
			const response = await fetch(
				"https://finance-tracking-n468.onrender.com/harcamalar",
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (response.status === 401) {
				handleLogout();
				return;
			}
			const data = await response.json();
			setTumVeriler(data);
		} catch (error) {
			console.error("Hata:", error);
		}
	};

	const fetchGuncelFiyatlar = async () => {
		const semboller = tumVeriler
			.filter((item) => item.is_investment)
			.map((item) => {
				if (["Altın", "Gümüş", "Dolar", "Euro"].includes(item.asset_type)) {
					// Türkçe karakterleri düzelt ve büyük harfe çevir
					if (item.asset_type === "Gümüş") return "GUMUS";
					return item.asset_type.toUpperCase();
				}
				return item.symbol;
			})
			.filter((s) => s);

		const uniqueSymbols = [...new Set(semboller)];
		if (uniqueSymbols.length === 0) return;

		try {
			const response = await fetch(
				"https://finance-tracking-n468.onrender.com/prices",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ symbols: uniqueSymbols }),
				}
			);
			const data = await response.json();
			setGuncelFiyatlar(data);
		} catch (error) {
			console.error("Fiyat hatası:", error);
		}
	};

	const handleInputChange = (e) => {
		setYeniIslem({ ...yeniIslem, [e.target.name]: e.target.value });
	};

	// --- FORM GÖNDERME VE HESAPLAMA ---
	const handleFormSubmit = async (e) => {
		e.preventDefault();

		let calculatedBuyPrice = yeniIslem.buy_price;
		let calculatedSymbol = yeniIslem.symbol;

		// 1. KRİPTO, ALTIN, GÜMÜŞ: Adet ve Tutar girilir, Birim Fiyat hesaplanır
		if (
			islemTuru === "yatirim" &&
			["Altın", "Gümüş", "Kripto"].includes(yeniIslem.asset_type)
		) {
			if (yeniIslem.miktar && yeniIslem.adet) {
				// Birim Fiyat = Toplam Tutar / Adet
				calculatedBuyPrice = (
					parseFloat(yeniIslem.miktar) / parseFloat(yeniIslem.adet)
				).toFixed(6);
			}
			// Altın/Gümüş sembolü sabittir
			if (yeniIslem.asset_type === "Altın") calculatedSymbol = "ALTIN";
			if (yeniIslem.asset_type === "Gümüş") calculatedSymbol = "GUMUS";
			// Kripto sembolü (örn: ETH) kullanıcıdan gelir
		}

		// 2. DOLAR/EURO: Kod sabittir
		if (
			islemTuru === "yatirim" &&
			["Dolar", "Euro"].includes(yeniIslem.asset_type)
		) {
			if (yeniIslem.asset_type === "Dolar") calculatedSymbol = "USD";
			if (yeniIslem.asset_type === "Euro") calculatedSymbol = "EUR";
		}

		const veri = {
			...yeniIslem,
			miktar: parseFloat(yeniIslem.miktar),
			is_investment: islemTuru === "yatirim",
			kategori:
				islemTuru === "yatirim" ? yeniIslem.asset_type : yeniIslem.kategori,
			symbol: islemTuru === "yatirim" ? calculatedSymbol : null,
			// Hesaplanmış fiyat varsa onu, yoksa girileni al
			buy_price:
				islemTuru === "yatirim" ? parseFloat(calculatedBuyPrice) : null,
		};

		try {
			const url = duzenlenenId
				? `https://finance-tracking-n468.onrender.com/harcamalar/${duzenlenenId}`
				: "https://finance-tracking-n468.onrender.com/harcamalar";
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
				fetchVeriler();
				setYeniIslem({
					...yeniIslem,
					aciklama: "",
					miktar: "",
					adet: "",
					symbol: "",
					buy_price: "",
				});
				setDuzenlenenId(null);
			} else {
				alert("Hata oluştu");
			}
		} catch (error) {
			console.error(error);
		}
	};

	const handleDuzenleSec = (item) => {
		setDuzenlenenId(item.id);
		setIslemTuru(item.is_investment ? "yatirim" : "gider");

		let calcAdet = "";
		if (item.is_investment && item.buy_price) {
			calcAdet = item.miktar / item.buy_price; // Adet hesapla
		}

		setYeniIslem({
			...item,
			adet: calcAdet, // Input'a geri yükle
			asset_type: item.is_investment ? item.kategori : "Altın",
		});
	};

	const handleSil = async (id) => {
		if (window.confirm("Silinsin mi?")) {
			await fetch(
				`https://finance-tracking-n468.onrender.com/harcamalar/${id}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			setTumVeriler(tumVeriler.filter((h) => h.id !== id));
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/login");
	};

	// ... (Chat fonksiyonları aynı) ...
	const handleSendMessage = async (e) => {
		if (e) e.preventDefault();
		if (!inputMessage.trim()) return;
		const userMsg = { sender: "user", text: inputMessage };
		setMessages((p) => [...p, userMsg]);
		setInputMessage("");
		setChatLoading(true);
		try {
			const response = await fetch(
				"https://finance-tracking-n468.onrender.com/chat",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ message: userMsg.text }),
				}
			);
			const data = await response.json();
			setMessages((p) => [...p, { sender: "bot", text: data.response }]);
		} catch (error) {
			setMessages((p) => [...p, { sender: "bot", text: "Hata." }]);
		} finally {
			setChatLoading(false);
		}
	};

	const calculateProfit = (item) => {
		// Backend'den gelen anahtarı bul (Backend: ALTIN, GUMUS, DOLAR...)
		let key = item.symbol;
		if (item.kategori === "Altın") key = "ALTIN";
		if (item.kategori === "Gümüş") key = "GUMUS";
		if (item.kategori === "Dolar") key = "DOLAR";
		if (item.kategori === "Euro") key = "EURO";

		if (!item.buy_price || !guncelFiyatlar[key]) return null;

		const currentPrice = guncelFiyatlar[key];
		const adet = item.miktar / item.buy_price;
		const guncelDeger = adet * currentPrice;
		const karZarar = guncelDeger - item.miktar;
		const yuzde = (karZarar / item.miktar) * 100;

		return {
			diff: karZarar,
			percent: yuzde,
			isProfit: karZarar >= 0,
			currentVal: guncelDeger,
		};
	};

	// Grafik Verileri
	const giderVerisi = goruntulenenVeriler
		.filter((v) => !v.is_investment)
		.reduce((a, c) => {
			const f = a.find((i) => i.name === c.kategori);
			if (f) f.value += c.miktar;
			else a.push({ name: c.kategori, value: c.miktar });
			return a;
		}, []);
	const yatirimVerisi = goruntulenenVeriler
		.filter((v) => v.is_investment)
		.reduce((a, c) => {
			const f = a.find((i) => i.name === c.kategori);
			if (f) f.value += c.miktar;
			else a.push({ name: c.kategori, value: c.miktar });
			return a;
		}, []);
	const ozetData = [
		{ name: "Gider", miktar: giderVerisi.reduce((a, b) => a + b.value, 0) },
		{ name: "Yatırım", miktar: yatirimVerisi.reduce((a, b) => a + b.value, 0) },
	];

	return (
		<div
			style={{
				minHeight: "100vh",
				fontFamily: "'Libre Baskerville', serif",
				position: "relative",
			}}>
			<div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					backgroundImage: "url('/finans.webp')",
					backgroundSize: "cover",
					opacity: 0.5,
					zIndex: -1,
				}}></div>

			<nav
				className="navbar px-4 py-2 sticky-top shadow-sm"
				style={{
					background: "linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)",
					color: "white",
				}}>
				<div className="d-flex align-items-center">
					<button
						className="btn btn-sm btn-outline-light border-0 me-3"
						onClick={() => setShowMenu(true)}>
						☰
					</button>
					<span
						className="fw-bold fs-6"
						style={{ fontFamily: "'Dancing Script'", fontSize: "1.2rem" }}>
						Varlık & Finans Yöneticisi
					</span>
				</div>
			</nav>

			<div className="container py-4" style={{ maxWidth: "1100px" }}>
				{/* Tarih Filtresi (Boş Başlar) */}
				<div className="card border-0 shadow-sm mb-4 p-2 bg-white rounded-4 bg-opacity-75">
					<div className="d-flex flex-wrap gap-2 align-items-center justify-content-center">
						<span className="text-primary fw-bold small">
							<BsCalendar3 className="me-2" /> Tarih:
						</span>
						<input
							type="date"
							className="form-control form-control-sm w-auto rounded-pill"
							value={baslangicTarihi}
							onChange={(e) => setBaslangicTarihi(e.target.value)}
						/>
						<span className="text-muted small">-</span>
						<input
							type="date"
							className="form-control form-control-sm w-auto rounded-pill"
							value={bitisTarihi}
							onChange={(e) => setBitisTarihi(e.target.value)}
						/>
					</div>
				</div>

				<div className="row g-4 mb-5">
					{/* FORM ALANI */}
					<div className="col-md-5">
						<div className="card shadow-sm border-0 h-100 rounded-4 bg-white bg-opacity-90">
							<div className="card-header bg-transparent border-0 pt-3 pb-0">
								<ul className="nav nav-pills nav-fill gap-2 p-1 bg-light rounded-3">
									<li className="nav-item">
										<button
											className={`nav-link btn-sm rounded-3 fw-bold small ${
												islemTuru === "gider"
													? "active bg-danger shadow-sm"
													: "text-muted"
											}`}
											onClick={() => setIslemTuru("gider")}>
											<BsCreditCard2FrontFill className="me-2" /> Gider
										</button>
									</li>
									<li className="nav-item">
										<button
											className={`nav-link btn-sm rounded-3 fw-bold small ${
												islemTuru === "yatirim"
													? "active bg-success shadow-sm"
													: "text-muted"
											}`}
											onClick={() => setIslemTuru("yatirim")}>
											<BsGraphUpArrow className="me-2" /> Yatırım
										</button>
									</li>
								</ul>
							</div>
							<div className="card-body pt-3">
								<form onSubmit={handleFormSubmit}>
									<div className="mb-2">
										<label
											className="small text-muted fw-bold"
											style={{ fontSize: "0.7rem" }}>
											TARİH
										</label>
										<input
											type="date"
											className="form-control form-control-sm bg-light border-0"
											name="tarih"
											value={yeniIslem.tarih}
											onChange={handleInputChange}
											required
										/>
									</div>

									{islemTuru === "gider" ? (
										<div className="row g-2 mb-2">
											<div className="col-6">
												<label
													className="small text-muted fw-bold"
													style={{ fontSize: "0.7rem" }}>
													TUTAR
												</label>
												<input
													type="number"
													className="form-control form-control-sm bg-light border-0"
													name="miktar"
													value={yeniIslem.miktar}
													onChange={handleInputChange}
													required
												/>
											</div>
											<div className="col-6">
												<label
													className="small text-muted fw-bold"
													style={{ fontSize: "0.7rem" }}>
													KATEGORİ
												</label>
												<select
													className="form-select form-select-sm bg-light border-0"
													name="kategori"
													value={yeniIslem.kategori}
													onChange={handleInputChange}>
													<option>Genel</option>
													<option>Gıda</option>
													<option>Ulaşım</option>
													<option>Eğlence</option>
													<option>Fatura</option>
													<option>Kira</option>
												</select>
											</div>
										</div>
									) : (
										<>
											<div className="mb-2">
												<label
													className="small text-muted fw-bold"
													style={{ fontSize: "0.7rem" }}>
													VARLIK TÜRÜ
												</label>
												<select
													className="form-select form-select-sm bg-light border-0"
													name="asset_type"
													value={yeniIslem.asset_type}
													onChange={handleInputChange}>
													<option>Altın</option>
													<option>Gümüş</option>
													<option>Dolar</option>
													<option>Euro</option>
													<option>Hisse</option>
													<option>Fon</option>
													<option>Eurobond</option>
													<option>Kripto</option>
												</select>
											</div>

											{/* --- ÖZEL INPUT ALANLARI --- */}
											{/* 1. Altın, Gümüş, Kripto -> Adet ve Tutar */}
											{["Altın", "Gümüş", "Kripto"].includes(
												yeniIslem.asset_type
											) && (
												<div className="row g-2 mb-2">
													<div className="col-6">
														<label
															className="small text-muted fw-bold"
															style={{ fontSize: "0.7rem" }}>
															{yeniIslem.asset_type === "Kripto"
																? "COIN ADEDİ"
																: "KAÇ GRAM?"}
														</label>
														<input
															type="number"
															className="form-control form-control-sm bg-light border-0"
															name="adet"
															value={yeniIslem.adet}
															onChange={handleInputChange}
															required
														/>
													</div>
													<div className="col-6">
														<label
															className="small text-muted fw-bold"
															style={{ fontSize: "0.7rem" }}>
															TOPLAM TUTAR
														</label>
														<input
															type="number"
															className="form-control form-control-sm bg-light border-0"
															name="miktar"
															value={yeniIslem.miktar}
															onChange={handleInputChange}
															required
														/>
													</div>
													{yeniIslem.asset_type === "Kripto" && (
														<div className="col-12 mt-2">
															<label
																className="small text-muted fw-bold"
																style={{ fontSize: "0.7rem" }}>
																COIN İSMİ (Örn: ETH)
															</label>
															<input
																type="text"
																className="form-control form-control-sm bg-light border-0"
																name="symbol"
																value={yeniIslem.symbol}
																onChange={handleInputChange}
																required
															/>
														</div>
													)}
												</div>
											)}

											{/* 2. Dolar, Euro -> Kur ve Tutar */}
											{["Dolar", "Euro"].includes(yeniIslem.asset_type) && (
												<div className="row g-2 mb-2">
													<div className="col-6">
														<label
															className="small text-muted fw-bold"
															style={{ fontSize: "0.7rem" }}>
															KUR
														</label>
														<input
															type="number"
															className="form-control form-control-sm bg-light border-0"
															name="buy_price"
															value={yeniIslem.buy_price}
															onChange={handleInputChange}
															required
														/>
													</div>
													<div className="col-6">
														<label
															className="small text-muted fw-bold"
															style={{ fontSize: "0.7rem" }}>
															TOPLAM TUTAR
														</label>
														<input
															type="number"
															className="form-control form-control-sm bg-light border-0"
															name="miktar"
															value={yeniIslem.miktar}
															onChange={handleInputChange}
															required
														/>
													</div>
												</div>
											)}

											{/* 3. Diğerleri -> Kod, Fiyat, Tutar */}
											{!["Altın", "Gümüş", "Kripto", "Dolar", "Euro"].includes(
												yeniIslem.asset_type
											) && (
												<>
													<div className="row g-2 mb-2">
														<div className="col-6">
															<label
																className="small text-muted fw-bold"
																style={{ fontSize: "0.7rem" }}>
																KOD
															</label>
															<input
																type="text"
																className="form-control form-control-sm bg-light border-0"
																name="symbol"
																value={yeniIslem.symbol}
																onChange={handleInputChange}
																required
															/>
														</div>
														<div className="col-6">
															<label
																className="small text-muted fw-bold"
																style={{ fontSize: "0.7rem" }}>
																BİRİM FİYAT
															</label>
															<input
																type="number"
																className="form-control form-control-sm bg-light border-0"
																name="buy_price"
																value={yeniIslem.buy_price}
																onChange={handleInputChange}
																required
															/>
														</div>
													</div>
													<div className="mb-2">
														<label
															className="small text-muted fw-bold"
															style={{ fontSize: "0.7rem" }}>
															TOPLAM TUTAR
														</label>
														<input
															type="number"
															className="form-control form-control-sm bg-light border-0"
															name="miktar"
															value={yeniIslem.miktar}
															onChange={handleInputChange}
															required
														/>
													</div>
												</>
											)}
										</>
									)}

									<div className="mb-3">
										<label
											className="small text-muted fw-bold"
											style={{ fontSize: "0.7rem" }}>
											AÇIKLAMA
										</label>
										<input
											type="text"
											className="form-control form-control-sm bg-light border-0"
											name="aciklama"
											value={yeniIslem.aciklama}
											onChange={handleInputChange}
											required
										/>
									</div>
									<button
										type="submit"
										className={`btn btn-sm w-100 fw-bold text-white shadow-sm py-2 ${
											islemTuru === "gider" ? "btn-danger" : "btn-success"
										}`}>
										{duzenlenenId
											? "GÜNCELLE"
											: islemTuru === "gider"
											? "HARCAMA EKLE"
											: "YATIRIM YAP"}
									</button>
									{duzenlenenId && (
										<button
											type="button"
											onClick={() => {
												setDuzenlenenId(null);
												setYeniIslem({
													...yeniIslem,
													aciklama: "",
													miktar: "",
													adet: "",
												});
											}}
											className="btn btn-sm btn-light w-100 mt-2 text-muted">
											İptal
										</button>
									)}
								</form>
							</div>
						</div>
					</div>

					{/* GRAFİK VE LİSTE ALANI (AYNI) */}
					<div className="col-md-7">
						<div className="card shadow-sm border-0 h-100 rounded-4 bg-white bg-opacity-90">
							<div className="card-header bg-transparent border-0 pt-3">
								<h6 className="text-muted small fw-bold mb-0 d-flex align-items-center">
									<BsPieChartFill className="me-2 text-primary" /> Finansal Özet
								</h6>
							</div>
							<div className="card-body">
								<div style={{ width: "100%", height: "200px" }}>
									<ResponsiveContainer>
										<BarChart data={ozetData}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} />
											<XAxis dataKey="name" tick={{ fontSize: 10 }} />
											<Tooltip
												formatter={(val) => `${val} ${currencySymbol}`}
											/>
											<Bar dataKey="miktar">
												<Cell fill="#FF6B6B" />
												<Cell fill="#00C49F" />
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="card shadow-sm border-0 rounded-4 bg-white bg-opacity-90">
					<div className="card-header bg-transparent py-3 border-0">
						<h6 className="fw-bold m-0 text-primary d-flex align-items-center small">
							<BsClockHistory className="me-2" /> İşlem Geçmişi
						</h6>
					</div>
					<div className="table-responsive">
						<table
							className="table table-hover table-sm align-middle mb-0"
							style={{ fontSize: "0.9rem" }}>
							<thead className="bg-light">
								<tr>
									<th className="ps-4 border-0">Tür</th>
									<th className="border-0">Açıklama</th>
									<th className="border-0">Piyasa / Durum</th>
									<th className="border-0">Tarih</th>
									<th className="text-end pe-4 border-0">Tutar</th>
									<th className="border-0"></th>
								</tr>
							</thead>
							<tbody>
								{goruntulenenVeriler.length === 0 ? (
									<tr>
										<td
											colSpan="6"
											className="text-center py-4 text-muted small">
											Kayıt yok.
										</td>
									</tr>
								) : (
									goruntulenenVeriler.map((item) => {
										const profitInfo = item.is_investment
											? calculateProfit(item)
											: null;
										const hesaplananAdet =
											item.is_investment && item.buy_price > 0
												? item.miktar / item.buy_price
												: null;

										return (
											<tr key={item.id}>
												<td className="ps-4">
													<span
														className={`badge ${
															item.is_investment ? "bg-success" : "bg-danger"
														} bg-opacity-10 text-${
															item.is_investment ? "success" : "danger"
														} rounded-pill px-2`}
														style={{ fontSize: "0.7rem" }}>
														{item.is_investment ? "YATIRIM" : "GİDER"}
													</span>
												</td>
												<td className="fw-medium text-dark">{item.aciklama}</td>
												<td>
													<div className="d-flex flex-column">
														<small
															className="text-muted"
															style={{ fontSize: "0.75rem" }}>
															{item.kategori}
															{item.symbol &&
																!["Altın", "Gümüş", "Dolar", "Euro"].includes(
																	item.kategori
																) && (
																	<span className="fw-bold text-dark ms-1">
																		({item.symbol})
																	</span>
																)}
															{["Altın", "Gümüş", "Kripto"].includes(
																item.kategori
															) &&
																hesaplananAdet && (
																	<span className="fw-bold text-dark ms-1">
																		(
																		{hesaplananAdet.toFixed(
																			item.kategori === "Kripto" ? 5 : 2
																		)}{" "}
																		{item.kategori === "Kripto" ? "ad" : "gr"})
																	</span>
																)}
														</small>
														{profitInfo ? (
															<small
																className={`fw-bold d-flex align-items-center ${
																	profitInfo.isProfit
																		? "text-success"
																		: "text-danger"
																}`}
																style={{ fontSize: "0.75rem" }}>
																{profitInfo.isProfit ? (
																	<BsArrowUpShort size={16} />
																) : (
																	<BsArrowDownShort size={16} />
																)}
																%{profitInfo.percent.toFixed(1)} (
																{profitInfo.diff > 0 ? "+" : ""}
																{profitInfo.diff.toFixed(0)} {currencySymbol})
															</small>
														) : (
															item.is_investment && (
																<small
																	className="text-muted"
																	style={{ fontSize: "0.7rem" }}>
																	(Veri Bekleniyor)
																</small>
															)
														)}
													</div>
												</td>
												<td className="text-muted small">{item.tarih}</td>
												<td className="text-end pe-4">
													<div className="d-flex flex-column align-items-end">
														{profitInfo ? (
															<>
																<span
																	className={`fw-bold ${
																		profitInfo.isProfit
																			? "text-success"
																			: "text-danger"
																	}`}
																	style={{ fontSize: "1rem" }}>
																	{profitInfo.currentVal.toLocaleString()}{" "}
																	{currencySymbol}
																</span>
																<small
																	className="text-muted"
																	style={{ fontSize: "0.7rem" }}>
																	Yatırılan: {item.miktar.toLocaleString()}{" "}
																	{currencySymbol}
																</small>
															</>
														) : (
															<span
																className="fw-bold"
																style={{
																	color: item.is_investment
																		? "#198754"
																		: "#dc3545",
																}}>
																{item.miktar.toLocaleString()} {currencySymbol}
															</span>
														)}
													</div>
												</td>
												<td className="text-end">
													<button
														onClick={() => handleDuzenleSec(item)}
														className="btn btn-sm btn-link text-primary p-0 me-2">
														<BsPencilSquare />
													</button>
													<button
														onClick={() => handleSil(item.id)}
														className="btn btn-sm btn-link text-danger p-0">
														<BsTrashFill />
													</button>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div
				className={`offcanvas offcanvas-start ${showMenu ? "show" : ""}`}
				tabIndex="-1"
				style={{
					visibility: showMenu ? "visible" : "hidden",
					width: "280px",
					zIndex: 1055,
					position: "fixed",
					top: 0,
					bottom: 0,
					left: 0,
					backgroundColor: "#f8f9fa",
					boxShadow: "5px 0 15px rgba(0,0,0,0.1)",
					border: "none",
				}}>
				{/* --- 1. MAVİ ŞERİT (HEADER) --- */}
				<div
					className="offcanvas-header p-4"
					style={{
						background: "linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)", // Sitenin ana rengi
						color: "white",
					}}>
					<div className="d-flex align-items-center gap-3">
						{/* Yuvarlak Baş Harf */}
						<div
							className="d-flex align-items-center justify-content-center rounded-circle bg-white text-primary fw-bold shadow-sm"
							style={{ width: "45px", height: "45px", fontSize: "1.2rem" }}>
							{/* İsmin ilk harfini al, yoksa 'U' koy */}
							{userInfo.full_name
								? userInfo.full_name.charAt(0).toUpperCase()
								: "U"}
						</div>

						{/* İsim ve Email Bilgisi */}
						<div style={{ overflow: "hidden" }}>
							<h6
								className="m-0 fw-bold text-truncate"
								style={{ maxWidth: "160px" }}>
								{userInfo.full_name || "Misafir"}
							</h6>
							<small className="opacity-75" style={{ fontSize: "0.75rem" }}>
								{userInfo.email || "Hoşgeldiniz"}
							</small>
						</div>
					</div>

					{/* Kapatma Butonu */}
					<button
						type="button"
						className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
						onClick={() => setShowMenu(false)}></button>
				</div>

				{/* --- 2. MENÜ BUTONLARI --- */}
				<div className="offcanvas-body p-0">
					<div className="p-3 d-flex flex-column gap-2 mt-2">
						{/* Profil */}
						<button
							onClick={() => {
								setShowMenu(false);
								navigate("/profile");
							}}
							className="btn btn-light w-100 text-start d-flex align-items-center gap-3 py-3 px-3 border-0 shadow-sm"
							style={{ borderRadius: "12px" }}>
							<span className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
								👤
							</span>
							<span className="fw-medium text-dark">Profilim</span>
						</button>

						{/* Ayarlar */}
						<button
							onClick={() => {
								setShowMenu(false);
								navigate("/settings");
							}}
							className="btn btn-light w-100 text-start d-flex align-items-center gap-3 py-3 px-3 border-0 shadow-sm"
							style={{ borderRadius: "12px" }}>
							<span className="bg-secondary bg-opacity-10 text-secondary p-2 rounded-circle">
								⚙️
							</span>
							<span className="fw-medium text-dark">Ayarlar</span>
						</button>
					</div>

					{/* En Altta Çıkış Butonu */}
					<div className="p-3 mt-auto position-absolute bottom-0 w-100">
						<button
							onClick={handleLogout}
							className="btn btn-danger w-100 py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
							🚪 Güvenli Çıkış
						</button>
					</div>
				</div>
			</div>
			{showMenu && (
				<div
					className="modal-backdrop fade show"
					onClick={() => setShowMenu(false)}
					style={{ zIndex: 1040 }}></div>
			)}

			{/* Chatbot (Basit Tutuldu) */}
			<button
				onClick={() => setIsChatOpen(!isChatOpen)}
				className="btn shadow-lg rounded-circle"
				style={{
					position: "fixed",
					bottom: "30px",
					right: "30px",
					width: "60px",
					height: "60px",
					background: "#1e3c72",
					color: "white",
					zIndex: 1060,
				}}>
				<BsChatDotsFill />
			</button>
			<div
				className={`card shadow-lg border-0`}
				style={{
					position: "fixed",
					bottom: "100px",
					right: "30px",
					width: "380px",
					height: "500px",
					zIndex: 1055,
					display: isChatOpen ? "flex" : "none",
					flexDirection: "column",
				}}>
				<div className="card-header bg-primary text-white">Asistan</div>

				<div
					className="card-body"
					style={{ overflowY: "auto", maxHeight: "400px" }}>
					{/* EKSİK OLAN KISIM BURASIYDI: Mesajları Listele */}
					{messages.map((msg, index) => (
						<div
							key={index}
							className={`d-flex mb-2 ${
								msg.sender === "user"
									? "justify-content-end"
									: "justify-content-start"
							}`}>
							<div
								className={`p-2 rounded-3 small shadow-sm ${
									msg.sender === "user"
										? "bg-primary text-white rounded-bottom-0" // Kullanıcı Mesajı
										: "bg-light text-dark border rounded-bottom-0" // Bot Mesajı
								}`}
								style={{ maxWidth: "80%" }}>
								{msg.sender === "bot" ? (
									<div className="d-flex align-items-start">
										{" "}
										{/* align-items-center yerine start */}
										{/* İkonu sabitle (flex-shrink-0) ve yukarı hizala */}
										<BsRobot
											className="me-2 text-primary mt-1 flex-shrink-0"
											size={18}
										/>
										{/* Metni sarmala ve taşmasını önle */}
										<div
											className="flex-grow-1"
											style={{
												overflowWrap: "break-word",
												wordBreak: "break-word",
											}}>
											<Markdown>{msg.text}</Markdown>
										</div>
									</div>
								) : (
									msg.text
								)}
							</div>
						</div>
					))}
					{/* Yükleniyor Animasyonu */}
					{chatLoading && (
						<div className="text-start text-muted small fst-italic ms-2">
							Yazıyor...
						</div>
					)}
					<div ref={chatEndRef}></div>
				</div>

				{/* INPUT ALANI (Burası sende zaten var ama eksikse diye atıyorum) */}
				<div className="card-footer bg-white border-0">
					<form
						className="input-group"
						onSubmit={handleSendMessage} // <-- Bunu eklemeyi unutma
					>
						<input
							ref={textareaRef}
							type="text"
							className="form-control form-control-sm bg-light border-0"
							placeholder="Finansal bir soru sor..."
							value={inputMessage}
							onChange={(e) => setInputMessage(e.target.value)}
						/>
						<button className="btn btn-sm btn-primary" type="submit">
							<BsSendFill />
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
