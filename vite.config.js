import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Caminhos relativos permitem abrir o painel dentro de /sgaprd/paineltv-modernizado/.
  base: './',
  // Sons ficam em public/sounds/ e são servidos pelo .htaccess no Apache/XAMPP.
  build: { copyPublicDir: false },
})
