import React from "react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const HarcamaGrafik = ({ veriler }) => {
	const gruplanmisVeri = veriler.reduce((acc, harcama) => {
		const mevcutKategori = acc.find((item) => item.name === harcama.kategori);
		if (mevcutKategori) {
			mevcutKategori.value += harcama.miktar;
		} else {
			acc.push({ name: harcama.kategori, value: harcama.miktar });
		}
		return acc;
	}, []);

	if (gruplanmisVeri.length === 0) {
		return (
			<div className="text-center text-muted p-5">
				Grafik için henüz veri yok.
			</div>
		);
	}

	return (
		// Kart ve Header'ı kaldırdık, sadece grafik kaldı.
		<div style={{ width: "100%", height: "350px" }}>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={gruplanmisVeri}
						cx="50%"
						cy="50%"
						labelLine={false}
						outerRadius={100}
						fill="#8884d8"
						dataKey="value"
						label={({ name, percent }) =>
							`${name} ${(percent * 100).toFixed(0)}%`
						}>
						{gruplanmisVeri.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={COLORS[index % COLORS.length]}
							/>
						))}
					</Pie>
					<Tooltip formatter={(value) => `${value} ₺`} />
					<Legend verticalAlign="bottom" height={36} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
};

export default HarcamaGrafik;
