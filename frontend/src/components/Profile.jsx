import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	BsArrowLeft,
	BsShieldLock,
	BsEnvelope,
	BsCheckCircleFill,
} from "react-icons/bs";
import { changePassword } from "../api";

const Profile = () => {
	const navigate = useNavigate();
	const email = localStorage.getItem("user_email") || "kullanici@mail.com";
	const name = localStorage.getItem("user_name") || "Kullanıcı";
	const token = localStorage.getItem("token");

	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
	const [message, setMessage] = useState({ type: "", text: "" });

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		setMessage({ type: "", text: "" });

		if (passwords.new !== passwords.confirm) {
			setMessage({ type: "danger", text: "Yeni şifreler uyuşmuyor!" });
			return;
		}

		try {
			await changePassword(passwords.old, passwords.new, token);
			setMessage({
				type: "success",
				text: "Şifreniz başarıyla güncellendi! Yönlendiriliyorsunuz...",
			});
			setTimeout(() => {
				navigate("/dashboard");
			}, 2000);
		} catch (error) {
			setMessage({ type: "danger", text: error.message });
		}
	};

	return (
		<div
			style={{
				position: "relative",
				minHeight: "100vh",
				fontFamily: "'Libre Baskerville', serif",
			}}>
			{/* --- ARKA PLAN RESMİ --- */}
			<div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					backgroundImage: "url('/finans.webp')",
					backgroundSize: "cover",
					backgroundPosition: "center",
					opacity: 0.5,
					zIndex: -1,
				}}></div>

			{/* --- SOL ÜST BUTON (GÜNCELLENDİ) --- */}
			<button
				onClick={() => navigate("/dashboard")}
				className="btn shadow-sm rounded-pill px-4 py-2 fw-bold d-flex align-items-center"
				style={{
					position: "absolute",
					top: "30px",
					left: "30px",
					backgroundColor: "#1e3c72", // Ana Mavi Renk
					color: "white",
					border: "none",
					zIndex: 10,
					fontSize: "0.9rem",
				}}>
				<BsArrowLeft className="me-2" /> Ana Sayfaya Dön
			</button>

			<div
				className="container py-5"
				style={{ maxWidth: "700px", paddingTop: "100px" }}>
				{" "}
				{/* paddingTop arttırıldı ki butonla çakışmasın */}
				{/* Profil Kartı */}
				<div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white bg-opacity-90">
					<div
						className="card-header border-0 py-5 text-center text-white"
						style={{
							background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
						}}>
						<div
							className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
							style={{
								width: "90px",
								height: "90px",
								fontSize: "2.5rem",
								fontWeight: "bold",
							}}>
							{name.charAt(0).toUpperCase()}
						</div>
						<h3 className="mb-1 fw-bold">{name}</h3>
						<p className="opacity-75 mb-0">{email}</p>
					</div>

					<div className="card-body p-4">
						<div className="mb-4">
							<label className="form-label small text-muted fw-bold">
								E-Posta Adresi
							</label>
							<div className="input-group">
								<span className="input-group-text bg-light border-end-0 text-muted">
									<BsEnvelope />
								</span>
								<input
									type="email"
									className="form-control bg-light"
									value={email}
									disabled
								/>
								<span
									className="input-group-text bg-light border-start-0 text-muted"
									style={{ fontSize: "0.8rem" }}>
									(Değiştirilemez)
								</span>
							</div>
						</div>

						<hr className="my-4 opacity-10" />

						<div className="d-flex align-items-center justify-content-between mb-3">
							<h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
								<BsShieldLock className="me-2 text-primary" /> Güvenlik
							</h6>
						</div>

						{message.text && (
							<div className={`alert alert-${message.type} small py-2`}>
								{message.text}
							</div>
						)}

						{!showPasswordForm ? (
							<button
								onClick={() => setShowPasswordForm(true)}
								className="btn btn-outline-primary w-100 rounded-pill fw-bold py-2">
								Şifremi Değiştir
							</button>
						) : (
							<form
								onSubmit={handlePasswordChange}
								className="bg-light p-4 rounded-3 border">
								<h6 className="mb-3 fw-bold text-primary">Şifre Yenileme</h6>
								<div className="mb-3">
									<label className="form-label small text-muted">
										Mevcut Şifre
									</label>
									<input
										type="password"
										className="form-control"
										placeholder="••••••••"
										value={passwords.old}
										onChange={(e) =>
											setPasswords({ ...passwords, old: e.target.value })
										}
										required
									/>
								</div>
								<div className="row g-2 mb-4">
									<div className="col-md-6">
										<label className="form-label small text-muted">
											Yeni Şifre
										</label>
										<input
											type="password"
											className="form-control"
											placeholder="Yeni şifre"
											value={passwords.new}
											onChange={(e) =>
												setPasswords({ ...passwords, new: e.target.value })
											}
											required
										/>
									</div>
									<div className="col-md-6">
										<label className="form-label small text-muted">
											Tekrar
										</label>
										<input
											type="password"
											className="form-control"
											placeholder="Tekrar"
											value={passwords.confirm}
											onChange={(e) =>
												setPasswords({ ...passwords, confirm: e.target.value })
											}
											required
										/>
									</div>
								</div>
								<div className="d-flex gap-2">
									<button
										type="submit"
										className="btn btn-primary flex-grow-1 rounded-pill fw-bold">
										<BsCheckCircleFill className="me-2" /> Güncelle
									</button>
									<button
										type="button"
										onClick={() => setShowPasswordForm(false)}
										className="btn btn-light text-muted rounded-pill px-4">
										Vazgeç
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
