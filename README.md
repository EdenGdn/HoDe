# HoDe - Landing Page

Landing page moderna y funcional para HoDe, plataforma que conecta clientes con profesionales verificados.

## 🚀 Características

- **Diseño moderno**: Estilo tipo startup inspirado en Airbnb/Uber
- **Totalmente responsive**: Funciona en desktop, tablet y móvil
- **Interacciones avanzadas**: Cursor luminoso con delay, parallax suave
- **Accesibilidad**: HTML semántico y navegación por teclado
- **Rendimiento**: CSS modular, animaciones optimizadas
- **Soporte amplio**: Polyfills para navegadores antiguos

## 📁 Estructura del Proyecto

```
HoDe/
├── index.html              # Página principal
├── css/
│   ├── styles.css          # Archivo principal de estilos
│   ├── variables.css       # Variables CSS (colores, fuentes, etc.)
│   ├── reset.css           # Reset CSS moderno
│   └── components/         # Estilos modulares por componente
│       ├── header.css
│       ├── hero.css
│       ├── luminic-cursor.css
│       ├── how-it-works.css
│       ├── differentiators.css
│       ├── professionals.css
│       ├── testimonials.css
│       ├── cta.css
│       └── footer.css
└── js/
    ├── polyfills.js        # Soporte para navegadores antiguos
    ├── script.js           # Script principal
    └── modules/            # Módulos JS
        ├── header.js
        └── luminic-cursor.js
```

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Semántico y accesible
- **CSS3**: Variables, Grid, Flexbox, animaciones
- **JavaScript ES6+**: Módulos, requestAnimationFrame
- **OKLCH**: Espacio de color moderno para mejor percepción

## 🎨 Diseño

### Paleta de Colores (OKLCH)
- Primario: `oklch(60% 0.2 240)` - Azul profesional
- Secundario: `oklch(70% 0.15 120)` - Verde confianza
- Acento: `oklch(80% 0.25 300)` - Púrpura moderno
- Cursor: `oklch(70% 0.3 240)` - Azul luminoso

### Tipografía
- Fuente principal: Inter (Google Fonts)
- Peso: 400, 500, 600, 700

## 📱 Secciones

1. **Header**: Navegación fija con efecto blur
2. **Hero**: Mensaje principal con parallax y botones CTA
3. **¿Cómo funciona?**: 3 pasos simples con íconos
4. **Diferenciadores**: 4 ventajas clave
5. **Profesionales**: Cards con foto, nombre, especialidad y rating
6. **Testimonios**: Opiniones realistas de usuarios
7. **CTA Final**: Llamado a registrarse
8. **Footer**: Enlaces, redes sociales y legales

## 🚀 Cómo Ejecutar

1. Clona o descarga el proyecto
2. Abre `index.html` en tu navegador web
3. La página se cargará completamente funcional

No requiere servidor web ni dependencias adicionales.

## 🔧 Desarrollo

### Principios Aplicados
- **SOLID**: Código modular y mantenible
- **CSS Modular**: Un archivo por componente
- **JavaScript Modular**: Funciones puras, separación de responsabilidades
- **Responsive First**: Mobile-first approach
- **Performance**: Animaciones GPU-accelerated

### Navegadores Soportados
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Con polyfills: IE11+ (funcionalidad básica)

## 📈 Optimizaciones

- **CSS**: @supports para fallbacks
- **JS**: requestAnimationFrame para animaciones suaves
- **Imágenes**: Placeholder SVG (reemplazar con imágenes reales)
- **Carga**: CSS crítico inline, JS defer

## 🎯 Próximos Pasos

Para producción:
1. Reemplazar placeholders con imágenes reales
2. Agregar analytics (Google Analytics)
3. Implementar formularios funcionales
4. Añadir PWA capabilities
5. Optimizar Core Web Vitals

## 📄 Licencia

Este proyecto es para fines demostrativos. Adaptar según necesidades comerciales.