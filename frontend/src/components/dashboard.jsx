import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// İKON KÜTÜPHANESİ GÜNCELLENDİ: Emojiler yerine profesyonel ikonlar
import {
	BsChatDotsFill,
	BsSendFill,
	BsX,
	BsRobot,
	BsWallet2,
	BsGraphUpArrow,
	BsCalendar3,
	BsPencilSquare,
	BsTrashFill,
	BsPieChartFill,
	BsClockHistory,
	BsCreditCard2FrontFill,
	BsCheckCircleFill,
} from "react-icons/bs";
import Markdown from "react-markdown";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
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
	const navigate = useNavigate();

	const [baslangicTarihi, setBaslangicTarihi] = useState(
		new Date().toISOString().split("T")[0]
	);
	const [bitisTarihi, setBitisTarihi] = useState(
		new Date().toISOString().split("T")[0]
	);
	const [islemTuru, setIslemTuru] = useState("gider");

	const [yeniIslem, setYeniIslem] = useState({
		aciklama: "",
		miktar: "",
		kategori: "Genel",
		tarih: new Date().toISOString().split("T")[0],
		is_investment: false,
		asset_type: "Altın",
		symbol: "",
		buy_price: "",
	});
	const [duzenlenenId, setDuzenlenenId] = useState(null);

	const [messages, setMessages] = useState([
		{
			sender: "bot",
			text: "Merhaba! Ben Finans Asistanın. Yatırımlarını ve harcamalarını analiz etmemi ister misin? 💰",
		},
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

	useEffect(() => {
		if (!token) navigate("/login");
		else fetchVeriler();
	}, []);

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isChatOpen]);

	useEffect(() => {
		filtrele(tumVeriler);
	}, [baslangicTarihi, bitisTarihi, tumVeriler]);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(
				textareaRef.current.scrollHeight,
				100
			)}px`;
		}
	}, [inputMessage]);

	const filtrele = (data) => {
		const filtrelenmis = data.filter(
			(item) => item.tarih >= baslangicTarihi && item.tarih <= bitisTarihi
		);
		setGoruntulenenVeriler(filtrelenmis);
	};

	const fetchVeriler = async () => {
		try {
			const response = await fetch("http://127.0.0.1:8000/harcamalar/", {
				headers: { Authorization: `Bearer ${token}` },
			});
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

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setYeniIslem({ ...yeniIslem, [name]: value });
	};

	const handleFormSubmit = async (e) => {
		e.preventDefault();
		const veri = {
			...yeniIslem,
			miktar: parseFloat(yeniIslem.miktar),
			is_investment: islemTuru === "yatirim",
			buy_price: yeniIslem.buy_price ? parseFloat(yeniIslem.buy_price) : null,
			kategori:
				islemTuru === "yatirim" ? yeniIslem.asset_type : yeniIslem.kategori,
		};

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
				fetchVeriler();
				setYeniIslem({
					...yeniIslem,
					aciklama: "",
					miktar: "",
					symbol: "",
					buy_price: "",
				});
				setDuzenlenenId(null);
			} else {
				alert("İşlem başarısız!");
			}
		} catch (error) {
			console.error(error);
		}
	};

	const handleDuzenleSec = (item) => {
		setDuzenlenenId(item.id);
		setIslemTuru(item.is_investment ? "yatirim" : "gider");
		setYeniIslem({
			...item,
			asset_type: item.is_investment ? item.kategori : "Altın",
		});
	};

	const handleSil = async (id) => {
		if (window.confirm("Silmek istediğine emin misin?")) {
			await fetch(`http://127.0.0.1:8000/harcamalar/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			setTumVeriler(tumVeriler.filter((h) => h.id !== id));
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/login");
	};

	const handleSendMessage = async (e) => {
		if (e) e.preventDefault();
		if (!inputMessage.trim()) return;

		const userMsg = { sender: "user", text: inputMessage };
		setMessages((p) => [...p, userMsg]);
		setInputMessage("");
		setChatLoading(true);
		if (textareaRef.current) textareaRef.current.style.height = "auto";

		try {
			const response = await fetch("http://127.0.0.1:8000/chat/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ message: userMsg.text }),
			});
			const data = await response.json();
			setMessages((p) => [...p, { sender: "bot", text: data.response }]);
		} catch (error) {
			setMessages((p) => [...p, { sender: "bot", text: "Hata oluştu." }]);
		} finally {
			setChatLoading(false);
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const giderVerisi = goruntulenenVeriler
		.filter((v) => !v.is_investment)
		.reduce((acc, curr) => {
			const found = acc.find((i) => i.name === curr.kategori);
			if (found) found.value += curr.miktar;
			else acc.push({ name: curr.kategori, value: curr.miktar });
			return acc;
		}, []);

	const yatirimVerisi = goruntulenenVeriler
		.filter((v) => v.is_investment)
		.reduce((acc, curr) => {
			const found = acc.find((i) => i.name === curr.kategori);
			if (found) found.value += curr.miktar;
			else acc.push({ name: curr.kategori, value: curr.miktar });
			return acc;
		}, []);

	const toplamGider = giderVerisi.reduce((a, b) => a + b.value, 0);
	const toplamYatirim = yatirimVerisi.reduce((a, b) => a + b.value, 0);
	const ozetData = [
		{ name: "Giderler", miktar: toplamGider },
		{ name: "Yatırımlar", miktar: toplamYatirim },
	];

	return (
		<div
			style={{
				minHeight: "100vh",
				fontFamily: "'Libre Baskerville', serif",
				background: "#f8f9fa",
			}}>
			<nav
				className="navbar px-4 py-3 sticky-top shadow-sm"
				style={{
					background: "linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)",
					color: "white",
				}}>
				<div className="d-flex align-items-center">
					<button
						className="btn btn-outline-light border-0 me-3"
						onClick={() => setShowMenu(true)}>
						☰
					</button>
					<span
						className="fw-bold fs-5"
						style={{ fontFamily: "'Dancing Script'" }}>
						Varlık & Finans Yöneticisi
					</span>
				</div>
			</nav>

			<div className="container pt-4">
				{/* TARİH FİLTRESİ (İkon Eklendi: BsCalendar3) */}
				<div className="card border-0 shadow-sm mb-4 p-3 bg-white rounded-4">
					<div className="d-flex flex-wrap gap-3 align-items-center justify-content-center">
						<span className="text-primary fw-bold d-flex align-items-center">
							<BsCalendar3 className="me-2" /> Tarih Aralığı:
						</span>
						<input
							type="date"
							className="form-control w-auto rounded-pill border-primary bg-light"
							value={baslangicTarihi}
							onChange={(e) => setBaslangicTarihi(e.target.value)}
						/>
						<span className="text-muted fw-bold">-</span>
						<input
							type="date"
							className="form-control w-auto rounded-pill border-primary bg-light"
							value={bitisTarihi}
							onChange={(e) => setBitisTarihi(e.target.value)}
						/>
					</div>
				</div>

				<div className="row mb-4">
					{/* SOL: FORM */}
					<div className="col-md-5 mb-3">
						<div className="card shadow-sm border-0 h-100 rounded-4">
							<div className="card-header bg-white border-0 pt-3 pb-0">
								<ul className="nav nav-pills nav-fill gap-2 p-1 bg-light rounded-pill">
									<li className="nav-item">
										<button
											className={`nav-link rounded-pill fw-bold d-flex align-items-center justify-content-center ${
												islemTuru === "gider"
													? "active bg-danger"
													: "text-muted"
											}`}
											onClick={() => setIslemTuru("gider")}>
											{/* İKON: Kredi Kartı */}
											<BsCreditCard2FrontFill className="me-2" /> Gider Ekle
										</button>
									</li>
									<li className="nav-item">
										<button
											className={`nav-link rounded-pill fw-bold d-flex align-items-center justify-content-center ${
												islemTuru === "yatirim"
													? "active bg-success"
													: "text-muted"
											}`}
											onClick={() => setIslemTuru("yatirim")}>
											{/* İKON: Yükseliş Grafiği (Landing Page ile aynı) */}
											<BsGraphUpArrow className="me-2" /> Yatırım Ekle
										</button>
									</li>
								</ul>
							</div>
							<div className="card-body">
								<form onSubmit={handleFormSubmit}>
									<div className="row g-2 mb-3">
										<div className="col-6">
											<label className="small text-muted fw-bold">Tarih</label>
											<input
												type="date"
												className="form-control"
												name="tarih"
												value={yeniIslem.tarih}
												onChange={handleInputChange}
												required
											/>
										</div>
										<div className="col-6">
											<label className="small text-muted fw-bold">
												Tutar (TL)
											</label>
											<input
												type="number"
												className="form-control"
												name="miktar"
												value={yeniIslem.miktar}
												onChange={handleInputChange}
												required
												placeholder="0.00"
											/>
										</div>
									</div>

									{islemTuru === "gider" ? (
										<div className="mb-3">
											<label className="small text-muted fw-bold">
												Kategori
											</label>
											<select
												className="form-select"
												name="kategori"
												value={yeniIslem.kategori}
												onChange={handleInputChange}>
												<option value="Genel">Genel</option>
												<option value="Gıda">Gıda</option>
												<option value="Ulaşım">Ulaşım</option>
												<option value="Eğlence">Eğlence</option>
												<option value="Fatura">Fatura</option>
												<option value="Kira">Kira</option>
											</select>
										</div>
									) : (
										<>
											<div className="mb-3">
												<label className="small text-muted fw-bold">
													Varlık Türü
												</label>
												<select
													className="form-select"
													name="asset_type"
													value={yeniIslem.asset_type}
													onChange={handleInputChange}>
													<option value="Altın">Altın (Gram/Çeyrek)</option>
													<option value="Dolar">Dolar ($)</option>
													<option value="Euro">Euro (€)</option>
													<option value="Hisse">Borsa İstanbul (Hisse)</option>
													<option value="Fon">Yatırım Fonu (TEFAS)</option>
													<option value="Eurobond">Eurobond</option>
													<option value="Kripto">Kripto / Kaldıraç</option>
												</select>
											</div>
											{["Hisse", "Fon", "Kripto", "Eurobond"].includes(
												yeniIslem.asset_type
											) && (
												<div className="row g-2 mb-3">
													<div className="col-6">
														<label className="small text-muted fw-bold">
															Kod (Örn: THYAO)
														</label>
														<input
															type="text"
															className="form-control"
															name="symbol"
															value={yeniIslem.symbol}
															onChange={handleInputChange}
															placeholder="Kod giriniz"
														/>
													</div>
													<div className="col-6">
														<label className="small text-muted fw-bold">
															Alış Fiyatı (Adet)
														</label>
														<input
															type="number"
															className="form-control"
															name="buy_price"
															value={yeniIslem.buy_price}
															onChange={handleInputChange}
															placeholder="Birim maliyet"
														/>
													</div>
												</div>
											)}
										</>
									)}

									<div className="mb-4">
										<label className="small text-muted fw-bold">Açıklama</label>
										<input
											type="text"
											className="form-control"
											name="aciklama"
											value={yeniIslem.aciklama}
											onChange={handleInputChange}
											placeholder={
												islemTuru === "gider"
													? "Market alışverişi..."
													: "Gelecek için birikim..."
											}
											required
										/>
									</div>

									<button
										type="submit"
										className={`btn w-100 fw-bold text-white shadow-sm d-flex align-items-center justify-content-center ${
											islemTuru === "gider" ? "btn-danger" : "btn-success"
										}`}>
										{/* Buton İkonları */}
										{duzenlenenId ? (
											<BsCheckCircleFill className="me-2" />
										) : islemTuru === "gider" ? (
											<BsWallet2 className="me-2" />
										) : (
											<BsGraphUpArrow className="me-2" />
										)}
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
												});
											}}
											className="btn btn-light w-100 mt-2 text-muted">
											İptal
										</button>
									)}
								</form>
							</div>
						</div>
					</div>

					{/* SAĞ: GRAFİKLER */}
					<div className="col-md-7 mb-3">
						<div className="card shadow-sm border-0 h-100 rounded-4">
							<div className="card-header bg-white border-0 pt-3">
								<h5 className="text-muted small text-uppercase fw-bold mb-0 d-flex align-items-center">
									<BsPieChartFill className="me-2 text-primary" /> Finansal
									Durum
								</h5>
							</div>
							<div className="card-body">
								<div className="row h-100">
									<div className="col-md-6 d-flex flex-column align-items-center">
										<span className="small fw-bold text-muted mb-2">
											{islemTuru === "gider"
												? "Gider Dağılımı"
												: "Varlık Dağılımı"}
										</span>
										<div style={{ width: "100%", height: "200px" }}>
											<ResponsiveContainer>
												<PieChart>
													<Pie
														data={
															islemTuru === "gider"
																? giderVerisi
																: yatirimVerisi
														}
														cx="50%"
														cy="50%"
														innerRadius={40}
														outerRadius={70}
														paddingAngle={5}
														dataKey="value">
														{(islemTuru === "gider"
															? giderVerisi
															: yatirimVerisi
														).map((entry, index) => (
															<Cell
																key={`cell-${index}`}
																fill={
																	(islemTuru === "gider"
																		? COLORS_EXPENSE
																		: COLORS_INVEST)[index % 5]
																}
															/>
														))}
													</Pie>
													<Tooltip formatter={(val) => `${val} ₺`} />
												</PieChart>
											</ResponsiveContainer>
										</div>
									</div>

									<div className="col-md-6 d-flex flex-column align-items-center">
										<span className="small fw-bold text-muted mb-2">
											Gelir vs Gider Dengesi
										</span>
										<div style={{ width: "100%", height: "200px" }}>
											<ResponsiveContainer>
												<BarChart data={ozetData}>
													<CartesianGrid
														strokeDasharray="3 3"
														vertical={false}
													/>
													<XAxis dataKey="name" tick={{ fontSize: 12 }} />
													<YAxis hide />
													<Tooltip formatter={(val) => `${val} ₺`} />
													<Bar dataKey="miktar">
														{ozetData.map((entry, index) => (
															<Cell
																key={`cell-${index}`}
																fill={index === 0 ? "#FF6B6B" : "#00C49F"}
															/>
														))}
													</Bar>
												</BarChart>
											</ResponsiveContainer>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* LİSTE */}
				<div className="card shadow-sm border-0 rounded-4">
					<div className="card-header bg-white py-3 border-0">
						<h6 className="fw-bold m-0 text-primary d-flex align-items-center">
							<BsClockHistory className="me-2" /> İşlem Geçmişi (
							{baslangicTarihi} / {bitisTarihi})
						</h6>
					</div>
					<div className="table-responsive">
						<table className="table table-hover align-middle mb-0">
							<thead className="bg-light">
								<tr>
									<th className="ps-4">Tür</th>
									<th>Açıklama</th>
									<th>Detay</th>
									<th>Tarih</th>
									<th className="text-end pe-4">Tutar</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{goruntulenenVeriler.length === 0 ? (
									<tr>
										<td colSpan="6" className="text-center py-4 text-muted">
											Bu tarih aralığında kayıt yok.
										</td>
									</tr>
								) : (
									goruntulenenVeriler.map((item) => (
										<tr key={item.id}>
											<td className="ps-4">
												<span
													className={`badge ${
														item.is_investment ? "bg-success" : "bg-danger"
													} bg-opacity-10 text-${
														item.is_investment ? "success" : "danger"
													}`}>
													{item.is_investment ? "YATIRIM" : "GİDER"}
												</span>
											</td>
											<td className="fw-medium">{item.aciklama}</td>
											<td>
												<small className="text-muted">
													{item.kategori}
													{item.symbol && ` (${item.symbol})`}
													{item.buy_price && ` @ ${item.buy_price} ₺`}
												</small>
											</td>
											<td>{item.tarih}</td>
											<td
												className="text-end pe-4 fw-bold"
												style={{
													color: item.is_investment ? "#198754" : "#dc3545",
												}}>
												{item.miktar.toLocaleString()} ₺
											</td>
											<td className="text-end">
												{/* İKONLAR: Düzenle (Kalem) ve Sil (Çöp Kutusu) */}
												<button
													onClick={() => handleDuzenleSec(item)}
													className="btn btn-sm btn-light me-2 text-primary"
													title="Düzenle">
													<BsPencilSquare />
												</button>
												<button
													onClick={() => handleSil(item.id)}
													className="btn btn-sm btn-light text-danger"
													title="Sil">
													<BsTrashFill />
												</button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* MENÜ (Sidebar) */}
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
					backgroundColor: "white",
					boxShadow: "5px 0 15px rgba(0,0,0,0.1)",
				}}>
				<div className="offcanvas-header border-bottom">
					<h5 className="offcanvas-title fw-bold text-dark">Menü</h5>
					<button
						type="button"
						className="btn-close"
						onClick={() => setShowMenu(false)}></button>
				</div>
				<div className="offcanvas-body p-0">
					<div className="list-group list-group-flush">
						<button className="list-group-item list-group-item-action py-3 border-0">
							<span className="me-3">👤</span> Profilim
						</button>
						<button className="list-group-item list-group-item-action py-3 border-0">
							<span className="me-3">⚙️</span> Ayarlar
						</button>
						<button
							onClick={handleLogout}
							className="list-group-item list-group-item-action py-3 border-0 text-danger fw-bold mt-auto">
							<span className="me-3">🚪</span> Çıkış Yap
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

			{/* CHATBOT */}
			<button
				onClick={() => setIsChatOpen(!isChatOpen)}
				className="btn shadow-lg rounded-circle d-flex align-items-center justify-content-center"
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
				{isChatOpen ? <BsX size={32} /> : <BsChatDotsFill size={24} />}
			</button>
			<div
				className={`card shadow-lg border-0`}
				style={{
					position: "fixed",
					bottom: "100px",
					right: "30px",
					width: "380px",
					height: "550px",
					zIndex: 1055,
					display: isChatOpen ? "flex" : "none",
					flexDirection: "column",
					borderRadius: "15px",
					overflow: "hidden",
				}}>
				<div
					className="card-header text-white p-3 d-flex align-items-center gap-2"
					style={{ background: "#1e3c72" }}>
					<BsRobot size={24} />
					<div className="flex-grow-1">
						<h6 className="mb-0 fw-bold">FinanceAgent AI</h6>
						<small>Çevrimiçi</small>
					</div>
					<button
						onClick={() => setIsChatOpen(false)}
						className="btn btn-sm text-white">
						<BsX size={24} />
					</button>
				</div>
				<div
					className="card-body p-3 bg-light d-flex flex-column gap-2"
					style={{ flex: 1, overflowY: "auto" }}>
					{messages.map((msg, i) => (
						<div
							key={i}
							className={`d-flex ${
								msg.sender === "user"
									? "justify-content-end"
									: "justify-content-start"
							}`}>
							<div
								style={{
									maxWidth: "85%",
									padding: "10px 14px",
									borderRadius: "15px",
									background: msg.sender === "user" ? "#1e3c72" : "white",
									color: msg.sender === "user" ? "white" : "black",
									boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
								}}>
								{msg.sender === "user" ? (
									msg.text
								) : (
									<Markdown>{msg.text}</Markdown>
								)}
							</div>
						</div>
					))}
					{chatLoading && (
						<div className="text-muted small ms-2">Yazıyor...</div>
					)}
					<div ref={chatEndRef} />
				</div>
				<div className="card-footer bg-white p-2">
					<form
						onSubmit={handleSendMessage}
						className="d-flex gap-2 align-items-end">
						<textarea
							ref={textareaRef}
							className="form-control border-0 bg-light"
							placeholder="Sorunu yaz..."
							value={inputMessage}
							onChange={(e) => setInputMessage(e.target.value)}
							onKeyDown={handleKeyDown}
							rows={1}
							style={{
								borderRadius: "20px",
								resize: "none",
								maxHeight: "100px",
							}}
						/>
						<button
							type="submit"
							className="btn btn-primary rounded-circle"
							style={{ width: "40px", height: "40px", background: "#1e3c72" }}
							disabled={!inputMessage.trim() || chatLoading}>
							<BsSendFill />
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
