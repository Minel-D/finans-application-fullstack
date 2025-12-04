import React from "react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

// Grafikte kullanacağımız renkler (Sırasıyla: Mavi, Yeşil, Turuncu, Kırmızı, Mor)
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const HarcamaGrafik = ({ veriler }) => {
	// --- VERİYİ HAZIRLAMA KISMI ---
	// Backend'den bize şöyle bir liste geliyor:
	// [{kategori: "Gıda", miktar: 100}, {kategori: "Gıda", miktar: 200}, {kategori: "Ulaşım", miktar: 50}]

	// Ama Grafik bizden şunu ister (Gruplanmış):
	// [{name: "Gıda", value: 300}, {name: "Ulaşım", value: 50}]

	// Aşağıdaki kod bu gruplama işlemini yapar:
	const gruplanmisVeri = veriler.reduce((acc, harcama) => {
		const mevcutKategori = acc.find((item) => item.name === harcama.kategori);
		if (mevcutKategori) {
			mevcutKategori.value += harcama.miktar; // Varsa üstüne ekle
		} else {
			acc.push({ name: harcama.kategori, value: harcama.miktar }); // Yoksa yeni ekle
		}
		return acc;
	}, []);

	// Eğer hiç veri yoksa boş kutu gösterme
	if (gruplanmisVeri.length === 0) {
		return (
			<div className="text-center text-muted p-3">
				Grafik için henüz veri yok.
			</div>
		);
	}

	return (
		<div className="card shadow mb-4" style={{ height: "400px" }}>
			<div className="card-header bg-primary text-white">
				<h5 className="mb-0">📊 Harcama Dağılımı</h5>
			</div>
			<div className="card-body">
				{/* ResponsiveContainer: Grafiğin ekran boyutuna göre büyümesini sağlar */}
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={gruplanmisVeri}
							cx="50%" // Yatayda ortala
							cy="50%" // Dikeyde ortala
							labelLine={false}
							outerRadius={80} // Dairenin büyüklüğü
							fill="#8884d8"
							dataKey="value" // Hangi veriyi kullanacak? (Miktar)
							label={({ name, percent }) =>
								`${name} ${(percent * 100).toFixed(0)}%`
							} // Yüzdelik gösterim
						>
							{gruplanmisVeri.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={COLORS[index % COLORS.length]}
								/>
							))}
						</Pie>
						<Tooltip formatter={(value) => `${value} ₺`} />{" "}
						{/* Üzerine gelince fiyat yazsın */}
						<Legend /> {/* Alt kısımda renklerin anlamını yazsın */}
					</PieChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default HarcamaGrafik;
