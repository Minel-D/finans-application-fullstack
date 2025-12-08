import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // YENİ
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		{/* BrowserRouter ile uygulamayı sarmalıyoruz */}
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>
);
