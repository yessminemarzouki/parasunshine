import preset from "./vendor/filament/support/tailwind.config.preset";

export default {
    presets: [preset],
    content: [
        "./app/Filament/**/*.php",
        "./resources/views/filament/**/*.blade.php",
        "./vendor/filament/**/*.blade.php",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#f0fdf9",
                    100: "#ccfbf1",
                    200: "#99f6e4",
                    300: "#5eead4",
                    400: "#2dd4bf",
                    500: "#00d4aa", // Couleur principale ParaSunshine
                    600: "#00aa88",
                    700: "#008066",
                    800: "#005544",
                    900: "#002b22",
                },
                secondary: {
                    50: "#f0fdf9",
                    100: "#ccfbf1",
                    200: "#99f6e4",
                    300: "#5eead4",
                    400: "#2dd4bf",
                    500: "#1a5242", // Vert foncé ParaSunshine
                    600: "#164236",
                    700: "#12322a",
                    800: "#0e221e",
                    900: "#0a1112",
                },
            },
        },
    },
};
