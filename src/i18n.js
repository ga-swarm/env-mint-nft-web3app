import i18n from "i18next";

import t_en from "./static/translations/en.json";
import e_ru from "./static/translations/ru.json";

i18n
	.init({
		debug: false,
		lng: "en",
		fallbackLng: "en", // use en if detected lng is not available

		keySeparator: false, // we do not use keys in form messages.welcome

		interpolation: {
			escapeValue: false // react already safes from xss
		},

		resources: {
			en: {
				translations: t_en
			},
			ru_lol: {
				translations: e_ru
			},
		},

		ns: ["translations"],
		defaultNS: "translations"
	});

export default i18n;
