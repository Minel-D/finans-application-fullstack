// Render Backend Adresi (Sonunda / işareti yok, dikkat!)
const BASE_URL = "https://finance-tracking-n468.onrender.com";

// --- KAYIT OLMA (İsim eklendi) ---
export const register = async (username, email, password) => {
	// username burada artık Ad Soyad (Full Name) olarak kullanılacak
	const response = await fetch(`${BASE_URL}/users/`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		// Backend 'full_name' bekliyor, 'username' değişkenini ona atıyoruz
		body: JSON.stringify({ full_name: username, email, password }),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.detail || "Kayıt işlemi başarısız");
	}
	return response.json();
};

// --- GİRİŞ YAPMA (Aynı kalabilir) ---
export const login = async (email, password) => {
	const formData = new URLSearchParams();
	formData.append("username", email);
	formData.append("password", password);

	const response = await fetch(`${BASE_URL}/token`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: formData,
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.detail || "Giriş başarısız!");
	}
	return response.json();
};

// --- YENİ: ŞİFRE DEĞİŞTİRME ---
export const changePassword = async (oldPassword, newPassword, token) => {
	const response = await fetch(`${BASE_URL}/users/change-password`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			old_password: oldPassword,
			new_password: newPassword,
		}),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.detail || "Şifre değiştirilemedi.");
	}
	return response.json();
};
