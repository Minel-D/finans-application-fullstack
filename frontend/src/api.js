// Backend Adresi (Python'un çalıştığı adres)
const BASE_URL = "http://127.0.0.1:8000";

// --- KAYIT OLMA FONKSİYONU ---
export const register = async (username, email, password) => {
	// Backend'e istek atıyoruz
	const response = await fetch(`${BASE_URL}/auth/register`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ username, email, password }),
	});

	// Eğer hata varsa fırlat (React yakalasın)
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.detail || "Kayıt başarısız");
	}

	return response.json();
};

// --- GİRİŞ YAPMA FONKSİYONU ---
export const login = async (email, password) => {
	// FastAPI form-data formatı bekliyor
	const formData = new URLSearchParams();
	formData.append("username", email);
	formData.append("password", password);

	const response = await fetch(`${BASE_URL}/auth/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: formData,
	});

	if (!response.ok) {
		throw new Error("Giriş başarısız");
	}

	return response.json();
};
