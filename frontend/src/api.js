// api.js - GÜNCEL HALİ

// DİKKAT: Sonunda "/docs" YOK! Sadece ana adres.
const BASE_URL = "http://127.0.0.1:8000";

// --- KAYIT OLMA FONKSİYONU ---
export const register = async (username, email, password) => {
	const response = await fetch(`${BASE_URL}/users/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ username, email, password }),
	});

	if (!response.ok) {
		const errorData = await response.json();
		// Backend'den gelen gerçek hatayı fırlatıyoruz
		throw new Error(errorData.detail || "Kayıt işlemi başarısız");
	}

	return response.json();
};

// --- GİRİŞ YAPMA FONKSİYONU ---
export const login = async (email, password) => {
	const formData = new URLSearchParams();
	formData.append("username", email);
	formData.append("password", password);

	// DİKKAT: "/auth/token" yerine sadece "/token" deniyoruz
	// Eğer Python'da prefix yoksa doğrusu budur.
	const response = await fetch(`${BASE_URL}/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: formData,
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.detail || "Giriş başarısız! Bilgileri kontrol edin."
		);
	}

	return response.json();
};
