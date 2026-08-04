# 02_PROJECT_ARCHITECTURE

## Arquitectura Oficial del Proyecto

| | |
|---|---|
| **Documento** | 02_PROJECT_ARCHITECTURE.md |
| **Estado** | Aprobado (v1.0) |
| **Autoridad** | Definición técnica monolítica que guía la implementación |
| **Audiencia** | Arquitectura, desarrollo, QA, DevOps, IA colaboradoras |
| **Documento previo** | `01_PROJECT_VISION.md` (vinculante, no contradable) |
| **Identidad / stack** | Ver `01_PROJECT_VISION.md`, `DESIGN_SYSTEM.md`, `03_TECH_STACK.md` |
| **Historial** | v1.0 — Redacción inicial |

---

> **Nota de autoridad.** Este documento es la referencia técnica definitiva. Define *cómo* está estructurado el sistema, *qué* tecnologías lo componen, *qué* principios lo gobiernan y *cómo* se garantiza su evolución. Ninguna implementación podrá desviarse de las decisiones aquí registradas salvo mediante un **Architectural Decision Record (ADR)**. Debe leerse como el primer documento técnico antes de escribir cualquier código.

---

## Tabla de contenidos

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [El proyecto que debe sostener la arquitectura](#2-el-proyecto-que-debe-sostener-la-arquitectura)
3. [Stack principal](#3-stack-principal)
4. [Filosofía de la arquitectura](#4-filosofía-de-la-arquitectura)
5. [Principios de desarrollo](#5-principios-de-desarrollo)
6. [Arquitectura general](#6-arquitectura-general)
7. [Arquitectura de Astro](#7-arquitectura-de-astro)
8. [Arquitectura de React](#8-arquitectura-de-react)
9. [Organización del proyecto](#9-organización-del-proyecto)
10. [Rutas](#10-rutas)
11. [Sistema de datos](#11-sistema-de-datos)
12. [Validaciones](#12-validaciones)
13. [Manejo de errores](#13-manejo-de-errores)
14. [Sistema de logs](#14-sistema-de-logs)
15. [Seguridad](#15-seguridad)
16. [Imágenes](#16-imágenes)
17. [SEO](#17-seo)
18. [Accesibilidad](#18-accesibilidad)
19. [Rendimiento](#19-rendimiento)
20. [Escalabilidad](#20-escalabilidad)
21. [Preparación para IA](#21-preparación-para-ia)
22. [Architectural Decisions (ADR)](#22-architectural-decisions-adr)
23. [Quality Attributes](#23-quality-attributes)
24. [Riesgos arquitectónicos](#24-riesgos-arquitectónicos)
25. [Technical Debt Policy](#25-technical-debt-policy)
26. [Principio de evolución](#26-principio-de-evolución)
27. [Reglas absolutas — Nunca hacer](#27-reglas-absolutas--nunca-hacer)
28. [Criterios de aceptación (autoevaluación)](#28-criterios-de-aceptación-autoevaluación)
29. [Cierre: filosofía arquitectónica](#29-cierre-filosofía-arquitectónica)

---

## 1. Propósito y alcance

`02_PROJECT_ARCHITECTURE.md` define la arquitectura oficial del sistema. A diferencia de `01_PROJECT_VISION.md` (qué es y por qué), este documento responde a: **cómo está compuesto el sistema, sobre qué principios técnicos se construye, qué decisiones lo rigen y cómo evolucionará sin romperse**.

El propósito es triple:

1. **Guiar la implementación.** Cualquier desarrolladora o IA debe poder leer este documento y construir el proyecto sin ambigüedad, siguiendo una única línea técnica.
2. **Proteger la visión.** Cada decisión técnica debe servir a la visión `01_PROJECT_VISION.md`. La arquitectura existe para sostener una experiencia artesanal de excelencia, no para satisfacer a quien la implementa.
3. **Garantizar la evolución.** La arquitectura debe soportar crecimiento (catálogo, administradoras, funciones, idiomas, tráfico) sin reescrituras destructivas. El [Principio de evolución](#26-principio-de-evolución) formaliza esta exigencia.

**Alcance.** El documento describe frontend, backend, base de datos, storage, autenticación, servicios, integraciones, hosting, CDN, rendimiento, seguridad, SEO, accesibilidad, observabilidad y deuda técnica. Su aplicación práctica se detalla en los documentos posteriores (`03` a `15`), que deben leerse como el desglose de lo aquí decidido.

**No alcance.** Este documento no contiene código de aplicación ni fragmentos de implementación. Define políticas, decisiones y patrones; su traducción a código se especifica en `04_FOLDER_STRUCTURE.md`, `14_CODING_STANDARDS.md` y documentos afines.

---

## 2. El proyecto que debe sostener la arquitectura

Antes de diseñar la arquitectura es imprescindible recordar qué sistema debe sostener, porque cada decisión técnica se justifica respecto a esta realidad (ver `01_PROJECT_VISION.md`, secciones 2 a 6).

### 2.1 La realidad del negocio

- Tienda online de una marca artesanal de crochet, de origen familiar.
- Catálogo diverso: amigurumis, bolsos, ropa tejida, pulseras, accesorios, decoración y piezas personalizadas.
- Venta con contacto humano por WhatsApp; **sin pagos en línea en el MVP** (ver `01_PROJECT_VISION.md` y ADR A.3 en este documento).
- Dos administradoras (Kaili y Dayna) con un único rol administrativo.
- Productos de dos naturalezas: en stock y fabricación bajo pedido.
- Crecimiento planificado a cinco años: más productos, colecciones, blog, posible internacionalización, e incluso fase futura de marketplace (ver `15_ROADMAP.md`).

### 2.2 Implicaciones arquitectónicas de la realidad

| Realidad | Implicación arquitectónica |
|---|---|
| Sin pagos en línea en MVP | La capa de "pago" se abstrae; el checkout concluye en generación de pedido + WhatsApp. El modelo reserva espacio para una futura pasarela sin romper nada. |
| Catálogo diverso y creciente | Modelo de datos extensible: producto, categoría, colección, variante y disponibilidad separados. |
| Dos administradoras, un rol | Autenticación con un único rol; autorización simple por rol, sin jerarquías. Extensible a más administradores con el mismo rol. |
| Dos naturalezas de producto | Campo de disponibilidad (stock / bajo pedido) que modifica el flujo y la comunicación de plazos. |
| SEO e identidad artesanal | Renderizado server-first (SSG) del contenido público; el estado y la interacción se aíslan donde aportan valor real. |
| Crecimiento a 5 años | Arquitectura modular, separación por dominios, elementos extensibles; el principio de evolución (sección 26) valida cada decisión. |

La arquitectura no solo debe ser técnicamente sólida; debe ser **proporcionada** a la realidad del negocio. Un sistema sobre-ingenierizado para un emprendimiento familiar introduciría complejidad y deuda (contradice YAGNI y KISS, sección 5). El objetivo es una arquitectura que resuelva el presente y admita el futuro sin exceso prematuro.

---

## 3. Stack principal

El stack oficial está compuesto por Astro, React, Tailwind CSS, shadcn/ui, Framer Motion, Supabase (Auth, Storage, PostgreSQL), TypeScript, Zod, React Hook Form, TanStack Query, Zustand, Lucide React, Embla Carousel, Git, GitHub y Vercel. La selección detallada, comparativas, versionado y librerías permitidas/prohibidas se documentan en `03_TECH_STACK.md`. Aquí se justifica cada elección por el problema que resuelve, su ventaja, su límite y cuándo debe (o no) usarse.

### 3.1 Astro

**Problema que resuelve:** lograr una experiencia server-first con un mínimo de JavaScript, indispensable para SEO y rendimiento en una tienda con contenido mayormente estático (catálogo, páginas de producto).

**Ventajas:** renderizado estático (SSG), Island Architecture (solo el código interactivo se envía e hidrata), contenido reactivo entre islas, integración sencilla de React, optimización de imágenes como `<Image>`, View Transitions.

**Limitaciones:** no es un framework universal de aplicación interactiva; la interactividad pesada debe delegarse en islas (React), introduciendo un posicionamiento claro de responsabilidades.

**Cuándo usarlo:** páginas públicas, catálogo, fichas de producto, blog —todo contenido que deba ser indexable y rápido.

**Cuándo NO usarlo:** por sí solo para gestionar estado interactivo complejo, paneles densos o lógica de cliente persistente; para eso se usan islas React (ver sección 8).

### 3.2 React

**Problema que resuelve:** proporcionar la interactividad que un catálogo estático no puede aportar: carrito, filtros reactivos, formularios, panel administrativo.

**Ventajas:** ecosistema maduro, modelo de componentes, herramientas (TanStack Query, React Hook Form, Zustand), composición natural con Framer Motion y shadcn/ui.

**Limitaciones:** aporta peso de JavaScript; si se usa indiscriminadamente degrada el rendimiento. En Astro su uso debe ser deliberado y limitado a las islas.

**Cuándo usarlo:** secciones interactivas como carrito, checkout, buscador, filtros y el panel admin.

**Cuándo NO usarlo:** para HTML estático que Astro puede renderizar sin estado; para ello se usa el componente Astro nativo (ver sección 7).

### 3.3 Tailwind CSS

**Problema que resuelve:** definir la capa de estilos de forma utilitaria y consistente, alineada con el sistema de diseño.

**Ventajas:** velocidad de desarrollo, coherencia mediante configuración (tokens), eliminación de CSS no usado en build (consecuencia directa para el rendimiento), integración natural con shadcn/ui y Astro.

**Limitaciones:** requiere disciplina para no duplicar estilos; la expresividad visual se delega en la configuración de tokens definida según `DESIGN_SYSTEM.md`.

**Cuándo usarlo:** todos los estilos del proyecto, mediante las primitivas y tokens oficiales.

**Cuándo NO usarlo:** para lógica o comportamiento; el estilo no debe mezclarse con la lógica de negocio.

### 3.4 shadcn/ui

**Problema que resuelve:** proveer un set de componentes accesibles y consistentes sobre Tailwind y Radix, sin ser una librería heredada sino un patrón de componentes con estado estilístico propio.

**Ventajas:** componentes accesibles (Fundador de Radix UI), estilizables con los tokens de marca, sin encierro (se copia y adapta al proyecto, evitando dependencias rígidas).

**Limitaciones:** requiere mantener y revisar los componentes adaptados; no debe usarse como una librería de caja negra.

**Cuándo usarlo:** componentes de interfaz reutilizables (botones, inputs, modales, drawers, toasts) adaptados a la identidad.

**Cuándo NO usarlo:** para lógica de negocio o para piezas que deben ser piezas de marca muy customizadas (que se implementan como componentes propios).

### 3.5 Framer Motion

**Problema que resuelve:** ejecutar el sistema de movimiento de la marca (ver `09_ANIMATION_SYSTEM.md`) con control preciso y respeto a las preferencias de reducción de movimiento.

**Ventajas:** declarations declarativas, soporte de `prefers-reduced-motion`, control de curvas y duraciones, tanto para React (islas) como para animaciones de entrada.

**Limitaciones:** añade peso de JavaScript si se usa en exceso; debe usarse de forma contenida y solo en componentes interactivos.

**Cuándo usarlo:** animaciones de marca, microinteracciones, transiciones en islas.

**Cuándo NO usarlo:** para animaciones CSS pura de bajo costo; no cargar la biblioteca globalmente si una transición de CSS resuelve el caso (ver `09_ANIMATION_SYSTEM.md`).

### 3.6 Supabase (Auth, Storage, PostgreSQL)

**Problema que resuelve:** backend gestionado (base de datos PostgreSQL, autenticación y almacenamiento de archivos) sin operar servidores propios, acelerando el MVP y reduciendo costos.

**Ventajas:** PostgreSQL maduro, RLS para seguridad a nivel de base de datos, Auth con tokens y sesiones, Storage para imágenes, escala horizontal y backups gestionados, modelo de datos relacional ideal para el catálogo y los pedidos.

**Limitaciones:** capa gestionada (menos control fino en casos extremos), costos al escalar mucho, y newsletters propias requieren integración adicional. Es importante no almacenar datos sensibles innecesarios (minimización de datos, ver `01_PROJECT_VISION.md` y sección 15).

**Cuándo usarlo:** catálogo, categorías, pedidos, clientes derivados, inventario, auth y storage de imágenes (ver `05_DATABASE.md`).

**Cuándo NO usarlo:** para estado de interfaz en cliente (eso es de Zustand) ni para lógica de negocio que deba vivir en la aplicación.

### 3.7 TypeScript

**Problema que resuelve:** añadir chequeo de tipos estático, haciendo más segura y mantenible la base de código de Astro y React.

**Ventajas:** detección temprana de errores, autocompletado, contratos compartidos entre capas (tipos de dominio), confianza para equipos e IA.

**Limitaciones:** requiere definir bien los tipos; los tipos mal diseñados generan fricción. Es indispensable y obligatorio (ver `14_CODING_STANDARDS.md`).

**Cuándo usarlo:** todo el código de la aplicación.

**Cuándo NO usarlo:** no aplicar (no optar por "escaparse" con `any` sistemático o JavaScript sin tipos), salvo casos acotados y justificados.

### 3.8 Zod

**Problema que resuelve:** validación de esquemas en runtime, garantizando que los datos que entran y salen cumplen los contratos definidos.

**Ventajas:** un solo lenguaje de esquema reutilizable entre cliente y servidor, mensajes de error controlados, sinergia con React Hook Form y Tipos compartidos.

**Limitaciones:** genera un peso pequeño en build si se importa en cliente; puede marginarse si se usa de forma descentralizada.

**Cuándo usarlo:** validación de formularios, esquemas de API, contratos de datos entre capas (ver sección 12).

**Cuándo NO usarlo:** para validar estructuras triviales del sistema interno que ya controla la base de datos, o para duplicar validaciones sin necesidad.

### 3.9 React Hook Form

**Problema que resuelve:** gestión de formularios con validación, errores y estado, con buen rendimiento y mínima re-renderización.

**Ventajas:** control de inputs sin re-renderización innecesaria, integración nativa con Zod (resolvers), ideal para flujos de checkout y pedidos personalizados.

**Limitaciones:** es una herramienta de formularios; no sustituye al manejo de estado global ni al de datos remotos.

**Cuándo usarlo:** todos los formularios (checkout, contacto, pedidos personalizados, configuraciones, admin).

**Cuándo NO usarlo:** para formularios triviales sin validación donde la implementación nativa es suficiente (decidir en `10_UI_COMPONENTS.md`).

### 3.10 TanStack Query

**Problema que resuelve:** sincronización de datos remotos (server state) provenientes de Supabase, con caché, invalidación y estados de carga/error.

**Ventajas:** caché inteligente, retries, refetch, y estados uniformes; desacopla la UI del origen de datos.

**Limitaciones:** gestiona exclusivamente server state; no debe usarse para estado de interfaz (ver sección 8 y ADR A.1).

**Cuándo usarlo:** todo dato dinámico de cliente y del panel admin (catálogo vivo, inventario, pedidos, dashboard).

**Cuándo NO usarlo:** para catálogo estático renderizado en build (gracias a SSG) ni para estado local de búsqueda/carrito (de Zustand).

### 3.11 Zustand

**Problema que resuelve:** estado de interfaz del cliente (client state) con API mínima y persistencia opcional.

**Ventajas:** bajo coste, sin provider, facilidad de persistir en `localStorage` (carrito), sin re-renderización excesiva.

**Limitaciones:** gestiona solo estado local; no sincroniza con servidor.

**Cuándo usarlo:** carrito, drawer/sidebar, modales, buscador, filtros temporales, toasts y preferencias. Ver ADR A.1.

**Cuándo NO usarlo:** para datos provenientes de Supabase (de TanStack Query).

### 3.12 Lucide React

**Problema que resuelve:** iconografía de línea fina, minimalista y sin rellenos, alineada con `DESIGN_SYSTEM.md`.

**Ventajas:** coherente con la identidad visual, árbol-shakeable (solo los iconos usados entran en el bundle).

**Cuándo usarlo:** todos los iconos de la interfaz.

**Cuándo NO usarlo:** no sustituir por otro set de iconos sin justificación de identidad.

### 3.13 Embla Carousel

**Problema que resuelve:** carruseles ligeros, accesibles y con buen rendimiento (galerías, destacados).

**Ventajas:** ligero, sin dependencias pesadas, control preciso, soporte táctil y de teclado.

**Cuándo usarlo:** carruseles de productos y galerías (ver `10_UI_COMPONENTS.md`).

**Cuándo NO usarlo:** cuando una grilla estática o una alternativa sin carrusel aporta mejor accesibilidad y rendimiento; el carrusel se usa con moderación.

### 3.14 Git y GitHub

**Problema que resuelve:** control de versiones y colaboración, incluida la colaboración con IA en PRs (ver sección 21).

**Ventajas:** trazabilidad, revisión, ramas, integración con CI/CD en Vercel.

**Cuándo usarlo:** todo el desarrollo (Git Flow simplificado: ver `13_DEPLOYMENT.md`).

**Cuándo NO usarlo:** no aplicar para contenido externo manejado fuera del repositorio.

### 3.15 Vercel

**Problema que resuelve:** despliegue y hosting del frontend con CDN, TLS y CI/CD.

**Ventajas:** despliegue automático, previews por PR, edge network, integración con Astro y monitoreo básico.

**Cuándo usarlo:** hosting de producción y previews.

**Cuándo NO usarlo:** para la base de datos (Supabase) y el storage; Vercel aloja solo la capa de presentación.

### 3.16 Decisión de stack completa

La justificación exhaustiva, alternativas descartadas y versionado están en `03_TECH_STACK.md`. La arquitectura se construye sobre este conjunto porque cada pieza resuelve un problema concreto y las piezas se delimitan claramente (server state vs. client state; SSG vs. islas). La correcta separación de responsabilidades entre estas piezas es el núcleo de la arquitectura.

---

## 4. Filosofía de la arquitectura

### 4.1 Arquitectura limpia (Clean Architecture)

La arquitectura limpia organiza el sistema en capas con dependencias apuntando hacia adentro: las reglas de negocio del núcleo no dependen de detalles externos (frameworks, bases de datos, UI). En este proyecto el "núcleo" es la lógica de dominio de la tienda artesanal: qué es un producto, qué es un pedido, qué significa estar en stock o bajo pedido, qué estados atraviesa un pedido, qué reglas rigen la personalización.

**Cómo se aplica:** el domino se modela con tipos y lógica de dominio pura (sin conocer Astro, React ni Supabase). Las capas externas (repositorios/servicios, componentes UI, validación) dependen de los contratos del dominio y no al revés. Esto permite cambiar de framework o de proveedor de datos sin reescribir el núcleo.

**Aplicación adaptada y pragmática.** No se busca una parafernalia académica de casos de uso en cada operación (riesgo de sobre-ingeniería, ver `03_TECH_STACK.md`). Se aplica el principio esencial: **separar el conocimiento de negocio de la infraestructura**, con una capa de dominio tipada y capas de servicios y UI que la usan. Ver `04_FOLDER_STRUCTURE.md`.

### 4.2 Separación de responsabilidades

Cada módulo tiene una única razón para existir (ver SOLID, sección 5). Es la primera línea de defensa contra el código espagueti y contra los componentes gigantes.

**Cómo se aplica:** UI, lógica de negocio, acceso a datos, validación y estado son capas distintas. Un componente React no consulta Supabase directamente: pasa por un servicio (ver sección 8 y ADR A.5). Un servicio no renderiza HTML. Las reglas de validación no viven dentro de un botón.

### 4.3 Escalabilidad

La escalabilidad es capacidad de crecer en múltiples dimensiones sin romper la arquitectura: más productos, más administradores, más funciones, más idiomas, más tráfico (ver sección 20). No es solo "soportar más carga": es "soportar más complejidad y más alcance con el mismo marco mental".

**Cómo se aplica:** modelo de datos extensible (sección 11 y `05_DATABASE.md`), modularidad por dominio (sección 9), ausencia de acoplamiento innecesario, y un sistema de diseño extensible. Cada decisión se contrasta con el [Principio de evolución](#26-principio-de-evolución).

### 4.4 Mantenibilidad

La mantenibilidad es la facilidad con la que el código puede comprenderse, modificarse y ampliarse sin introducir errores. En un proyecto familiar que crecerá con ayuda de IA, la mantenibilidad es decisiva: quien edite dentro de tres meses debe entender las reglas sin resolver puzles.

**Cómo se aplica:** convenciones claras (`14_CODING_STANDARDS.md`), estructura predecible (`04_FOLDER_STRUCTURE.md`), tipos explícitos (sección 3.7), componentes pequeños (regla de no-gigantismo, sección 27), y documentación que enseña.

### 4.5 Reutilización

Reutilización es aprovechar una única implementación correcta en múltiples lugares, evitando duplicación (DRY).

**Cómo se aplica:** componentes de UI reutilizables sobre shadcn/ui, servicios de datos únicos, tipos y esquemas compartidos (Zod), y hooks de lógica común. La reutilización nunca debe forzarse hasta el punto de crear acoplamientos frágiles: si dos usos divergen en intención, se separan (ver la tensión DRY/consistencia en sección 5).

### 4.6 Simplicidad

La simplicidad es elegir deliberadamente la opción menos compleja que cumple el requisito real. Combate la complejidad accidental (la que el código introduce por sí mismo) en favor de la complejidad esencial (la inevitable del problema).

**Cómo se aplica:** KISS y YAGNI (sección 5); no construir infraestructura para necesidades futuras inciertas; preferir la solución directa cuando basta.

### 4.7 Consistencia

La consistencia es la uniformidad de decisiones y patrones en todo el sistema: misma estructura, mismos nombres, mismas convenciones, mismo flujo de datos. Hace el sistema predecible para quien lo desarrolla y para la IA que lo colabora.

**Cómo se aplica:** convenciones documentadas (`14_CODING_STANDARDS.md`), sistema de diseño unificado (`10_UI_COMPONENTS.md`), patrones estándar de acceso a datos y validación. La inconsistencia es una de las principales fuentes de deuda técnica (sección 25).

### 4.8 Síntesis de la filosofía

La filosofía se resume en un principio rector: **estructurar el sistema para que sea claro hoy y evolucione mañana**, separando el qué (negocio) del cómo (herramientas), sin sobre-ingeniería. Esa es la base de una arquitectura mantenible, escalable y a la vez sencilla.

---

## 5. Principios de desarrollo

Estos principios guían cada decisión de implementación y revisión. No son reglas sueltas: son el filtro con el que se evalúa cualquier solución propuesta, a favor de la filosofía de la sección 4.

### 5.1 SOLID

Cinco principios de diseño de objetos que favorecen la mantenibilidad:

- **S — Single Responsibility.** Cada módulo/clase/función tiene una única responsabilidad. *Aplicación:* un componente de UI no mezcla acceso a datos; un servicio no renderiza.
- **O — Open/Closed.** El código está abierto a extensión, cerrado a modificación. *Aplicación:* añadir un tipo de producto no debe exigir tocar el núcleo de la lógica de pedido; se modela de forma extensible (ver `05_DATABASE.md`).
- **L — Liskov Substitution.** Los subtipos son sustituibles por su tipo base. *Aplicación:* los contratos tipados garantizan que las implementaciones cumplen la interfaz declarada.
- **I — Interface Segregation.** No forzar a una clase a depender de interfaces que no usa. *Aplicación:* servicios y hooks expuestos con contratos mínimos.
- **D — Dependency Inversion.** Los módulos de alto nivel no dependen de los de bajo nivel; ambos dependen de abstracciones. *Aplicación:* el dominio depende de contratos, no de Supabase directamente.

**Impacto futuro:** adherir a SOLID previene el componente gigante y el código acoplado; sin él, el crecimiento obligaría a reescrituras (deuda estructural).

### 5.2 DRY (Don't Repeat Yourself)

Evitar duplicación de lógica y de conocimiento. *Aplicación:* servicios únicos, tipos y esquemas compartidos, helpers centralizados.

**Matiz:** DRY no debe imponerse ciegamente. Dos usos que difieren en intención deben separarse aunque compartan código (la duplicación accidental puede ser preferible a un acoplamiento prematuro). La decisión se toma con criterio en `14_CODING_STANDARDS.md`.

### 5.3 KISS (Keep It Simple, Stupid)

Priorizar la solución más simple que resuelve el problema real. *Aplicación:* no añadir abstracciones innecesarias, no construir infraestructura para casos que no ocurren.

**Impacto:** la simplicidad reduce bugs y deuda; un sistema simple es más fácil de mantener y de evolucionar.

### 5.4 YAGNI (You Aren't Gonna Need It)

No construir funcionalidad especulativa porque "podría necesitarse". *Aplicación:* no implementar PWA, pagos en línea ni multilenguaje en el MVP (ver `01_PROJECT_VISION.md` y ADR); se reservan con capacidad de crecimiento, no con código prematuro.

**Tensión con el principio de evolución:** YAGNI se equilibra con la necesidad de no diseñar rincones de no-retorno. La regla práctica: **diseñar para lo probable, no implementar para lo especulativo.** La arquitectura prepara el terreno (modelo extensible), pero no genera código de funciones futuras.

### 5.5 Composition over Inheritance

Preferir composición (combinar comportamientos) antes que jerarquías de herencia rígidas. *Aplicación:* componentes React compuestos por piezas más pequeñas; hooks reutilizables; no "clases base" que heredan comportamiento.

### 5.6 Single Responsibility

Refuerzo de la S de SOLID, relevante en el frontend: cada componente hace una cosa. *Aplicación:* separar presentación (cómo se ve) de comportamiento (cómo actúa) y de datos (dé dónde proviene). (Ver también sección 8.)

### 5.7 Progressive Enhancement

El contenido y la funcionalidad básica deben funcionar incluso sin JavaScript avanzado; el enriquecimiento se añade por capas. *Aplicación:* gracias a Astro, el contenido público es HTML/SSG funcional; las islas React añaden la mejora interactiva solo donde aporta.

**Impacto:** resiliencia y SEO; un fallo de JavaScript no deja el sitio vacío.

### 5.8 Mobile First

Diseñar y desarrollar primero para móvil (dispositivo principal del público, ver `01_PROJECT_VISION.md`, sección 10), luego escalar a pantallas mayores. *Aplicación:* grids responsive, controles táctiles, plazos de carga en redes móviles.

### 5.9 Accessibility First

La accesibilidad es una condición de partida (WCAG), no una mejora posterior (ver sección 18). *Aplicación:* contraste, teclado, ARIA, `prefers-reduced-motion`, lectores de pantalla se consideran desde el diseño de cada componente.

### 5.10 Performance First

El rendimiento es un requisito de arquitectura con objetivos medibles (sección 19). *Aplicación:* SSG, imágenes optimizadas, hidratación mínima, bundle controlado, prevención del CLS.

### 5.11 SEO First

Toda página pública se diseña para ser rastreable e indexable (sección 17). *Aplicación:* metadata, Open Graph, Schema.org, URLs limpias y permanentes, robots y sitemap.

### 5.12 Security First

La seguridad se considera desde el diseño, no como un parche posterior (sección 15). *Aplicación:* validación en todas las capas, RLS en base de datos, secretos en variables de entorno, principio de minimización de datos.

### 5.13 Offline Friendly (cuando tenga sentido)

Se reconoce la capacidad de funcionar en condiciones de red degradada. *Aplicación actual:* carrito persistido en `localStorage` vía Zustand. No se implementa PWA en el MVP (YAGNI); se documenta como evolución (ver `15_ROADMAP.md`).

### 5.14 Developer Experience (DX)

El proceso de desarrollo debe ser agradable y seguro para personas e IA. *Aplicación:* convenciones claras, types, tooling de calidad, documentación que enseña, y flujos de trabajo definidos (sección 21 y `14_CODING_STANDARDS.md`). Una buena DX reduce errores y reticencia a mantener el sistema.

---

## 6. Arquitectura general

La arquitectura general se compone de varias capas que se comunican de forma ordenada. A continuación se describen todos los componentes del sistema y cómo se relacionan.

### 6.1 Frontend (presentación)

El frontend está construido con Astro y React (ver secciones 7 y 8). Es **server-first**: el contenido público se pre-renderiza en build (SSG) para lograr el mejor SEO y rendimiento posibles, y la interactividad se añade mediante islas React donde aporta valor real. La capa de presentación nunca contiene lógica de negocio ni acceso directo a la base de datos: se apoya en la capa de servicios.

### 6.2 Backend (servicios e integraciones)

El "backend" se compone de la capa de servicios de la aplicación (lógica de datos y orquestación) en el entorno de Astro, y de las capacidades gestionadas de Supabase. No existe un servidor de aplicaciones propio y separado: se aprovecha la integración de Astro con serverless (Astro Server Endpoints) para las pocas operaciones que requieren ejecución en servidor (por ejemplo, generación del pedido previo a WhatsApp y operaciones del panel admin). La mayor parte de la lógica de datos gira en torno a Supabase con políticas de seguridad del lado del servidor (RLS).

**Detalle:** el acceso a Supabase desde el cliente público se hace de forma mínima y siempre por debajo de RLS; las operaciones sensibles (crear pedido, admin) ocurren a través de Server Endpoints que validan y autorizan del lado del servidor (sección 12 y 15).

### 6.3 Base de datos

PostgreSQL gestionado por Supabase. Alberga el catálogo, categorías, colecciones, pedidos, clientes derivados, inventario, configuraciones y auditoría (cuando aplique). El diseño de esquema se documenta en `05_DATABASE.md`; aquí se establece su papel como fuente de verdad de datos persistente y su protección mediante RLS.

### 6.4 Storage

Supabase Storage aloja las imágenes de productos, galería y del proceso. Las imágenes se sirven a través del CDN optimizadas y en formatos modernos (AVIF/WebP) mediante Astro Image (ver sección 16 y `05_DATABASE.md`).

### 6.5 Autenticación

Supabase Auth provee autenticación de administradoras. El sistema tiene un único rol administrativo (ver `06_AUTH_AND_ROLES.md`). El cliente público no requiere cuenta en el MVP (ver `01_PROJECT_VISION.md` y ADR C.1). Las sesiones y tokens se gestionan con Supabase; la protección de rutas del panel admin se resuelve en el frontend (sección 10).

### 6.6 Servicios

Capa de servicios que encapsula el acceso a datos (repositorios/servicios de dominio) y la orquestación. Es el puente entre la UI y Supabase; ningún componente accede a Supabase directamente (ADR A.5). Ver secciones 8 y 9.

### 6.7 Integraciones

Las integraciones externas actuales y previstas:

- **WhatsApp:** el checkout abre una conversación de WhatsApp con el resumen del pedido (ver `08_ECOMMERCE_FLOW.md`). No hay API de WhatsApp en el MVP; el enlace se construye con `wa.me`.
- **Google Analytics:** analytics del sitio (ver `11_SEO.md` y `12_PERFORMANCE.md`).
- **Futuras:** pasarela de pagos, y posiblemente integrar el envío y el correo del blog. No se implementan en el MVP (YAGNI).

### 6.8 Hosting y CDN

El frontend se despliega en Vercel, que provee el hosting, TLS y CDN (red de distribución de contenido). Supabase provee el backend gestionado (DB, Auth, Storage). Ver `13_DEPLOYMENT.md`.

### 6.9 Optimización de imágenes

Las imágenes se optimizan con Astro Image: formatos modernos (AVIF/WebP), tamaños responsive, lazy loading y preloading del LCP. Ver sección 16 y `12_PERFORMANCE.md`.

### 6.10 Analytics

Google Analytics recoge datos de uso anónimos y agregados. Se configura conforme a las buenas prácticas de privacidad y minimización de datos (sección 14 y 15). Ver `11_SEO.md`.

### 6.11 Logs

Se mantiene un sistema de logs de errores y eventos relevantes, con normas estrictas de privacidad (sección 14). Se prioriza no registrar datos personales ni contenido de conversaciones.

### 6.12 Backups

Supabase gestiona los backups de la base de datos y el storage. Se documenta la política y la estrategia de recuperación en `05_DATABASE.md` y `13_DEPLOYMENT.md`.

### 6.13 Escalabilidad

La arquitectura es escalable en las tres dimensiones relevantes para el negocio: datos (catálogo y pedidos), funciones (colecciones, blog, personalización) y alcance (idiomas, más administradores). La escalabilidad técnica (tráfico) se resuelve con SSG + CDN (frontend) y la infraestructura gestionada de Supabase (backend). Ver sección 20.

### 6.14 Diagrama de capas

```
Vista (Astro / React islands)
   │  (usa contratos, nunca infraestructura directa)
   ▼
Servicios (repositorios + orquestación de dominio)
   │
   ├──► Validación (Zod, en todos los límites)
   ├──► Supabase (PostgreSQL, Auth, Storage) — protegido por RLS
   └──► Server Endpoints (autorización y operaciones sensibles)
   │
   ▼
Storage (Supabase, CDN)  ·  CI/CD (Vercel)  ·  Analytics (GA)  ·  Logs
```

---

## 7. Arquitectura de Astro

### 7.1 Por qué Astro

Astro se eligió por su enfoque server-first que encaja con el contenido predominantemente estático de la tienda. Un catálogo, fichas de producto y páginas institucionales se benefician enormemente de un renderizado que no requiere JavaScript para mostrar contenido. Esto aporta SEO y rendimiento sin esfuerzo (ver `03_TECH_STACK.md` y `12_PERFORMANCE.md`).

### 7.2 Cómo funciona Astro

Astro pre-renderiza los componentes en HTML en el momento del build (SSG). Cada una de las "islas" interactivas (componentes React) se transporta a la página acompañada de su JavaScript y se hidrata según la directiva especificada (`client:load`, `client:visible`, etc.). El contenido no interactivo queda como HTML estático sin carga de JavaScript.

### 7.3 Island Architecture

El principio de las islas: la página tiene HTML/SSG completo que funciona solo con el navegador, y piezas aisladas de interactividad (islas) que se hidratan de forma independiente. Esto contrasta con una SPA donde toda la aplicación debe hidratarse. Las islas permiten hidratar **solo lo necesario**, lo que minimiza el JavaScript transmitido y maximiza el rendimiento (dimensión crítica: Hydration / bundle, ver sección 19).

### 7.4 Cuándo usar componentes Astro (no interactivos)

Se usan componentes `.astro` para todo lo que no necesita comportamiento de cliente:
- Páginas y layouts.
- Catálogo y fichas de producto (render estático desde datos del build).
- Footer, secciones informativas, proceso, testimonios.
- Componentes puramente presentacionales sin estado.

Regla: **si no requiere estado de cliente ni reaccionar a la interacción, es un componente Astro.** Esto mantiene el sitio ligero.

### 7.5 Cuándo usar React (dentro de islas)

Se usan componentes React únicamente donde existe interactividad real y no se puede resolver con HTML/CSS estático:
- Carrito y su drawer.
- Checkout y formularios (React Hook Form + Zod).
- Buscador y filtros en vivo.
- Panel administrativo completo.
- Animaciones de marca que requieren control de estado (Framer Motion en islas, de forma contenida).
- Toasts y microinteracciones dinámicas.

### 7.6 Cuándo hidratar

Se hidrata una isla cuando su interacción comienza:
- `client:visible`: ideal para islas por debajo del pliegue (carrito, filtros no visibles inicialmente) — se hidrata cuando entra en el viewport.
- `client:load`: para islas que deben interactuar de inmediato al cargar la página (p. ej., navbar con menú/móvil, buscador superior).
- `client:idle`: para mejoras no críticas que pueden esperar a que el navegador esté en reposo.

**Regla:** cargar lo mínimo, tan pronto como aporte valor, y nunca antes.

### 7.7 Cuándo NO hidratar

- No hidratar componentes presentacionales estáticos (deben ser Astro).
- No hidratar islas que no están en pantalla (usar `client:visible`).
- No hidratar mejoras decorativas que no aportan funcionalidad.
- No hidratar contenido que debe ser índexable y que ya está en el HTML inicial.

### 7.8 SSR, SSG, CSR y Partial Hydration

- **SSG (static site generation)** es la estrategia por defecto: todo el catálogo y contenido público se pre-renderiza como HTML estático.
- **SSR (server-side rendering)** se usa puntualmente donde se necesita datos dinámicos en servidor o autorización (server endpoints admin, generación de pedido). Astro permite renderizado híbrido por ruta.
- **CSR (client-side rendering)** se limita a las islas React, donde la interactividad del cliente lo requiere.
- **Partial Hydration** es el principio que combina las anteriores: se hidrata parcialmente solo donde hace falta.

La decisión SSG/SSR por ruta se especifica en `04_FOLDER_STRUCTURE.md` y cada ficha de página en `10_UI_COMPONENTS.md`.

### 7.9 Client Directives

Se usan las directivas de Astro de forma deliberada y con intención clara de rendimiento. La tabla de decisión de qué directiva usar por tipo de isla se documenta en `04_FOLDER_STRUCTURE.md` y `12_PERFORMANCE.md`.

### 7.10 View Transitions

Astro View Transitions se usan para transiciones de página fluidas y de bajo coste, coherentes con la identidad de marca (ver `09_ANIMATION_SYSTEM.md`). Deben ser elegantes y respetar `prefers-reduced-motion`. No se usan donde perjudiquen la accesibilidad.

### 7.11 Optimización automática

Astro optimiza automáticamente: elimina JavaScript de componentes estáticos, árbol-shake, y minifica en build. Se complementa con configuración explícita para imágenes, sources de fuentes y prefetch (sección 19).

### 7.12 Renderizado híbrido

El proyecto usa **renderizado híbrido** de Astro: por defecto estático (SSG) y rutas específicas en modo servidor (SSR) cuando lo requieren (admin, generación de pedidos). Esto equilibra rendimiento y dinamismo.

### 7.13 Rutas, layouts y contenido

- **Rutas:** se organizan por dominio de contenido en `src/pages` (ver sección 10).
- **Layouts:** layouts base (público y admin) que componen las páginas reutilizando estructura, header, footer y metadata.
- **Contenido / Colecciones:** Astro Content Collections se usan para el blog y para contenido editorial con schema tipado (ver `01_PROJECT_VISION.md` sección 15 y `15_ROADMAP.md`). El catálogo se sirve desde Supabase; se contempla la posibilidad de pre-renderizar el catálogo en build para maximizar el SEO (ver ADR C.2).

---

## 8. Arquitectura de React

### 8.1 Qué partes vivirán en React

React vive en las islas interactivas: carrito, checkout, filtros, buscador, formularios y el panel administrativo. Los componentes `.astro` presentacionales cubren el contenido estático.

### 8.2 Qué nunca debe hacerse en React

- Renderizar contenido estático índexable que debe estar en el HTML inicial (debe ser Astro).
- Duplicar la presentación de catálogo que ya se resuelve en el build.
- Convertir la aplicación en una SPA completa (contradiría la arquitectura server-first).
- Acceder a Supabase directamente desde la isla (debe ir por un servicio; ADR A.5).

### 8.3 Estados

Se distinguen dos tipos de estado, gestionados por herramientas distintas (ADR A.1):

- **Server state:** datos remotos provenientes de Supabase → **TanStack Query**.
- **Client state:** datos locales de interfaz → **Zustand**.

Esta separación es una regla absoluta. Nunca se mezclan: TanStack Query no administra estado de UI; Zustand no administra datos de servidor.

### 8.4 Hooks

- Hooks de React para estado local de componentes y efectos.
- Hooks custom (encapsulados en `src/hooks` o por feature, ver `04_FOLDER_STRUCTURE.md`) para lógica reutilizable (uso de carrito, consultas de datos con TanStack, formularios).
- Regla: los hooks concentran lógica; los componentes se limitan a presentación y orquestación.

### 8.5 Composición

Los componentes se combinan por composición (sección 5.5). Un componente grande se descompone en piezas más pequeñas con responsabilidades únicas. Se evita el "componente gigante" (regla de no-gigantismo, sección 27).

### 8.6 Context

React Context se usa con moderación y conciencia. Se prefiere Zustand para estado de cliente global compartido (carrito, drawer, toasts) por su claridad y bajo coste. Context queda para dependencias inyectables acotadas (tema de UI, configuración local del provider) si aportan valor sin re-renderización excesiva y sin mezclarse con server state.

### 8.7 Providers

Los providers de TanStack Query (QueryClientProvider) y los de tema/UI se instalan en las raíces de las islas correspondientes. El proveedor de Query es imprescindible donde haya consultas de datos reactivas. Se organiza de forma aislada para no cargar lógica en el contenido estático.

### 8.8 Server State (TanStack Query)

Se gestionan con TanStack Query: catálogo dinámico (filtros, búsqueda), inventario, pedidos y panel admin. Reglas: definiciones de consultas claras, claves estables, invalidación tras mutaciones, estados de carga/error/éxito tipados.

### 8.9 Client State (Zustand)

Se gestionan con Zustand: carrito (persistido en `localStorage`), drawer/sidebar, modales, estado del buscador, filtros temporales y toasts globales. Zustand no se usa para datos de servidor.

### 8.10 Cuándo usar Zustand

Para client state global persistente o compartido entre muchas piezas, con prioridad: carrito. (Ver ADR A.1 y `03_TECH_STACK.md`.)

### 8.11 Cuándo usar TanStack Query

Para todo server state reactivo: consultas y mutaciones de datos remotos. (Ver ADR A.1.)

### 8.12 Cuándo usar Context

Solo para dependencias acotadas de inyección (tema, configuración local) sin lógica de dominio; nunca para carrito ni para server state.

### 8.13 Qué evitar

- Mezclar server state y client state en la misma herramienta.
- Providers globales que provoquen re-renderización masiva.
- Estado duplicado en varios lugares (violar la fuente única de cada dato).
- Componentes React para contenido que debe ser estático.
- Lógica de negocio en componentes de presentación.

---

## 9. Organización del proyecto

La estructura de carpetas es un elemento arquitectónico y no un detalle cosmético. Una buena organización evita deuda técnica facilitando la localización, la evolución y la colaboración (humana y de IA). El detalle exacto de la arborescencia está en `04_FOLDER_STRUCTURE.md`; aquí se definen los principios que la guían.

### 9.1 Modularidad

El sistema se organiza en módulos con límites claros. Cada módulo agrupa sus componentes, hooks, servicios, tipos y validación en un mismo lugar (alta cohesión). Esto permite trabajar en una feature sin dispersarse por todo el código y aislar el impacto de los cambios.

### 9.2 Escalabilidad organizacional

La estructura crece de forma ordenada: añadir un producto o una feature requiere localizar y extender su módulo, no reestructurar el proyecto. Una estructura plana y dispersa se vuelve rápidamente inmanejable con el crecimiento (ver sección 20).

### 9.3 Bajo acoplamiento

Los módulos dependen de contratos (tipos/servicios) y no de implementaciones internas ajenas. Un cambio en un módulo no debería cascadear a otros. La separación section 8 entre estado y presentación contribuye al bajo acoplamiento.

### 9.4 Alta cohesión

Todo lo relacionado con un dominio vive cerca (tipos, servicios, componentes, hooks, validación). Esto reduce el "salto de contexto" y el riesgo de duplicación.

### 9.5 Separación por dominios (Domain Driven Design adaptado)

El proyecto se organiza alrededor del dominio del negocio: productos, categorías, colecciones, pedidos, clientes, inventario, configuraciones, autenticación. Cada dominio es una unidad cohesiva. DDD adaptado significa aplicar el concepto de *bounded context* sin la parafernalia completa (siendo pragmático y unitario para este emprendimiento). Ver `04_FOLDER_STRUCTURE.md` y `05_DATABASE.md`.

### 9.6 Feature Driven Design

Las features (carrito, checkout, panel admin, catálogo) agrupan su propio código en módulos feature. Un feature dirige su presentación y su lógica de datos. Esto es compatible con la organización por dominios: los features usan los servicios de dominio.

### 9.7 Síntesis organizacional

La tesis de esta sección es que **la estructura traduce la arquitectura**: separación de responsabilidades (sección 4), dominios y features (9.5/9.6), y contenedores claros para cada tipo de artefacto (componentes, hooks, servicios, tipos, validación, animaciones). Ver `04_FOLDER_STRUCTURE.md` para la implementación.

---

## 10. Rutas

### 10.1 Filosofía de rutas

Las rutas son públicas (visibles e índexables) o privadas (panel admin). La filosofía es mantener URLs limpias, permanentes y descriptivas, alineadas con el SEO (sección 17).

### 10.2 Rutas públicas

- `/` — inicio (hero, categorías, destacados, proceso, testimonios, newsletter).
- `/catalogo` o `/productos` — listado con filtros.
- `/categoria/[slug]` — listado por categoría.
- `/producto/[slug]` — ficha de producto.
- `/proceso` — sección de proceso artesanal.
- `/personalizado` — flujo de piezas bajo pedido.
- `/contacto` y `/nosotras` — contacto y presentación.
- `/blog` y `/blog/[slug]` — contenido editorial (incremental, ver `15_ROADMAP.md`).
- `/legal` (privacidad, términos) — cumplimiento.

### 10.3 Rutas privadas (panel admin)

- `/admin` — dashboard.
- `/admin/productos`, `/admin/categorias`, `/admin/pedidos`, `/admin/clientes`, `/admin/galeria`, `/admin/inventario`, `/admin/configuracion`.
Todas protegidas por autenticación y autorización (sección 15 y `06_AUTH_AND_ROLES.md`).

### 10.4 SEO y URLs limpias

- Sin parámetros crípticos; los slugs son descriptivos y legibles.
- Los slugs permanecen estables en el tiempo (una vez fijada una URL pública, no cambia sin redirección; ver sección 17 y `11_SEO.md`).

### 10.5 URLs permanentes

Una URL pública debe ser permanente. Cada producto, categoría y colección tiene un slug único y estable que sirve tanto de dirección como de identidad de contenido. Cambiar un slug implica conservar redirección 301 (ver `11_SEO.md`).

### 10.6 Slugs

Los slugs se generan a partir del nombre con normalización (minusculas, sin acentos, separador `-`) y son únicos. El slug de un producto nunca cambia una vez publicado.

### 10.7 Canonical URLs

Cada ruta pública emite su `canonical`. El listado y la ficha emiten el canonical correcto para evitar duplicación (ver `11_SEO.md`).

---

## 11. Sistema de datos

### 11.1 Flujo de datos

La información viaja de forma ordenada a través de las capas:

```
Usuario
   ▼
Frontend (UI)
   ▼
Validación (Zod, boundaries)
   ▼
Servicios (repositorios + orquestación)
   ▼
Supabase (PostgreSQL / Auth / Storage, RLS)
   ▼
Respuesta
   ▼
Renderizado
```

### 11.2 Explicación del flujo

1. **Usuario** interactúa con la UI (envía un formulario, filtra, consulta).
2. **Frontend (UI)** conduce la interacción; no contiene lógica de negocio.
3. **Validación** se aplica en el límite de entrada (Zod) para verificar contratos antes de que los datos sigan (sección 12).
4. **Servicios** traducen la petición en operaciones de acceso a datos u orquestación; es la única capa que habla con Supabase (ADR A.5).
5. **Supabase** ejecuta la operación bajo políticas RLS, devolviendo datos.
6. **Respuesta** viaja de vuelta de forma tipada.
7. **Renderizado** presenta la respuesta en la UI (en las islas, actualizando el estado de TanStack Query; en ver build-time, pre-renderizado).

### 11.3 Reglas de datos

- Fuente única de verdad: los datos persisten en Supabase; el frontend no mantiene copias de negocio en servidor salvo caché de lectura.
- Todo cruce de capa valida (sección 12).
- Todo acceso a Supabase ocurre por servicio, nunca directo desde un componente (ADR A.5).
- Los datos sensibles se minimizan (sección 14 y 15).
- Los tipos de dominio se comparten y se rigen por Zod (sección 12.4).

---

## 12. Validaciones

### 12.1 Múltiples capas de validación

**Nunca se confía únicamente en el cliente.** La validación ocurre en tres capas:

1. **Frontend:** validación de UX (formato, requerido, feedback inmediato) mediante React Hook Form + Zod en las islas.
2. **Backend (server endpoints / servicios):** revalidación autoritaria de toda operación sensible (crear pedido, admin) en el servidor. Es la capa que decide de verdad.
3. **Base de datos:** restricciones y triggers a nivel de esquema como última línea de defensa (ver `05_DATABASE.md`).

### 12.2 Nunca confiar únicamente en el cliente

La frontera entre cliente y servidor es un límite de confianza. Todo lo que pueda ser manipulado se revalida del lado del servidor. El frontend ofrece agilidad; el backend impone la verdad.

### 12.3 Uso de Zod

Zod define los esquemas (schemas) de datos. Un mismo esquema sirve para validar entrada en el frontend y para validar en el servidor, evitando divergencias y duplicaciones. Zod es la fuente única de contratos de datos (junto a los tipos de dominio).

### 12.4 Tipos compartidos

Los tipos de dominio (`Producto`, `Pedido`, `Categoria`, etc.) se declaran una vez y se comparten entre capas. Se deriven de los esquemas Zod cuando sea posible (`z.infer`), garantizando coherencia entre tipos en tiempo de compilación y validación en runtime. Ver `04_FOLDER_STRUCTURE.md`.

### 12.5 Errores y mensajes

- Los mensajes de validación se centralizan y son legibles por personas (voz de marca, ver `01_PROJECT_VISION.md` sección 7).
- Se distingue error de usuario (campo) de error de sistema (infraestructura) y cada uno se trata de forma distinta (sección 13).
- Los mensajes nunca revelan detalles internos de seguridad.

---

## 13. Manejo de errores

### 13.1 Estrategia general

Toda error se clasifica y se trata con una respuesta apropiada, sin romper la experiencia ni la seguridad.

### 13.2 Tipos de error

1. **Errores del usuario:** entradas inválidas o estados no permitidos. *Respuesta:* feedback claro en el formulario/UI, sin fricción.
2. **Errores de red:** conexión perdida o lenta. *Respuesta:* estados de retry/reintento y mensajes comprensibles; caché de TanStack Query mitiga cuando posible.
3. **Errores de Supabase:** fallos del backend (auth, DB, storage). *Respuesta:* error tipado, mensaje seguro impreso para el usuario, causa técnica a logs (sección 14).
4. **Errores inesperados:** excepciones no clasificadas. *Respuesta:* pantalla de error amable (boundary) sin exponer detalles, registro completo en logs.
5. **Errores de imágenes:** imagen no disponible o fallo de carga. *Respuesta:* estado de fallback visual y texto alternativo (alt) correcto; nunca romper la página.
6. **Errores de autenticación:** sesión expirada, token inválido, sin permisos. *Respuesta:* redirigir/indicar y permitir reacceso; en admin, cierre seguro de sesión.

### 13.3 Cómo se registran

Los errores se registran con contexto (endpoint, acción, capa) en el sistema de logs (sección 14), **sin** incluir datos personales ni secretos. En producción se evita exponer stack traces al usuario.

### 13.4 Cómo se muestran

- Errores de usuario: inline y específicos del campo.
- Errores de red/datos: toasts o estados de carga/error con opción de reintentar.
- Errores inesperados: página/boundary amigable con opción de volver.
- Los mensajes muestran tono de marca (humano, cálido, claro) sin tecnicismos.

### 13.5 Cómo se recupera

- Reintentar automáticamente en peticiones idempotentes (TanStack Query retries).
- Invalidar caché tras errores de mutación para no dejar estado inconsistente.
- Permitir reingreso de formularios sin pérdida de datos (mantener el estado del cliente).
- Ante error de pedido, no perder los datos del carrito (persistencia en `localStorage`).

---

## 14. Sistema de logs

### 14.1 Qué registrar

- Errores técnicos con contexto (capas de 13.2), con identificador y hora.
- Eventos importantes de negocio (pedido creado, estado cambiado) sin datos personales innecesarios.
- Eventos de seguridad relevantes (intento de acceso reiterado, acciones admin sensibles) con anonimización cuando aplique.

### 14.2 Qué nunca registrar

- Contenido de conversaciones de WhatsApp (prohibido, ver `01_PROJECT_VISION.md` sección 2.5 y ADR B.5).
- Datos personales sensibles (datos bancarios, datos íntimos, claves).
- Secretos o tokens (jamás en logs).
- Información de pago aunque exista una pasarela futura (regla permanente).

### 14.3 Privacidad

Se sigue la minimización de datos (ADR B.5): se captura lo estrictamente necesario. Los logs no permiten reconstruir datos personales de forma innecesaria.

### 14.4 Errores y eventos importantes

Los logs distinguen severidad (info, warn, error, security) para filtrar y alertar.

### 14.5 Seguridad

El acceso a los logs está restringido a administradoras responsables y se protege como infraestructura. No se exponen logs al público ni en la UI del cliente. Se evita un registro que permita suplantación o fuga de información sensible.

---

## 15. Seguridad

### 15.1 XSS (Cross-Site Scripting)

- No se inserta HTML no confiable sin escapar. React y Astro escapan por defecto.
- Se usa `dangerouslySetInnerHTML` y equivalentes solo en casos acotados y sanitizados (se define en `14_CODING_STANDARDS.md`).
- El contenido escrito por usuarios (si existe reseñas/contacto) se valida y sanitiza del lado del servidor (Zod + saneado).

### 15.2 CSRF (Cross-Site Request Forgery)

- Los Server Endpoints y mutaciones sensibles verifican el origen/origen de la petición.
- Se usan los mecanismos de protección de sesión de Supabase.
- No se confía en cookies autenticadas sin validación de mismo origen.

### 15.3 SQL Injection

- El acceso a base de datos usa siempre querys parametrizadas del cliente de Supabase y de las políticas RLS del servidor. Nunca se concatenan inputs en consultas.
- Los filtros del usuario son validados por Zod antes de llegar a la consulta.

### 15.4 Validaciones

Se aplican en las tres capas (sección 12). Toda entrada es sospechosa hasta validarse en servidor.

### 15.5 Storage

- Las imágenes se validan por mime/tipo y tamaño antes de subir.
- Las políticas de acceso a buckets se restringen (público solo lo que debe ser público; admin/privado lo que no lo es) vía RLS y políticas de Storage (ver `05_DATABASE.md`).

### 15.6 Autenticación

Supabase Auth gestiona identidad, sesiones y tokens. Se definen políticas de contraseña, protección contra fuerza bruta y cierre de sesión. Ver `06_AUTH_AND_ROLES.md`.

### 15.7 Autorización

- RLS en base de datos: cada tabla tiene políticas que limitan quién puede leer/escribir qué (ver `05_DATABASE.md` y ADR sobre RLS).
- El panel admin exige sesión de administradora y cada acción sensible se autoriza en servidor (Server Endpoints).
- Un único rol administrativo simplifica y endurece la autorización (ADR A.2).

### 15.8 Rate Limiting

- Se aplica límites a endpoints sensibles (login, creación de pedidos, contacto) para prevenir abusos.
- Supabase/Vercel proveen mecanismos por capa; se configuran según el flujo (ver `13_DEPLOYMENT.md`).

### 15.9 Headers

Se establecen cabeceras de seguridad: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Frame-Ancestors`, etc. Se configuran en la capa de hosting (Vercel) de forma coherente (ver `13_DEPLOYMENT.md`).

### 15.10 Variables de entorno y Secrets

- Los secretos (claves de Supabase, tokens) viven solo en variables de entorno del entorno de despliegue, nunca en el repositorio ni en el código.
- Se usan distintas variables por entorno (dev, preview, producción).
- Se establece un `.env.example` documentado sin valores reales y un directorio-como-única-fuente de claves gestionado por el hosting.
- **Regla permanente:** nunca exponer claves en el código, en logs, en la UI ni en el repositorio.

---

## 16. Imágenes

La fotografía es determinante en una tienda artesanal (ver `01_PROJECT_VISION.md` y `DESIGN_SYSTEM.md`). La arquitectura de imágenes prioriza calidad visual y rendimiento sin sacrificar ninguno.

### 16.1 Cómo se almacenan

- En Supabase Storage, organizado por buckets y rutas por tipo de contenido (productos, galería, proceso, blog).
- Los metadatos de imagen (alt, título, URL optimizable, dimensiones) se almacenan de forma estructurada en la base de datos (ver `05_DATABASE.md`).

### 16.2 Cómo se optimizan

Mediante Astro Image: se generan múltiples tamaños, se convierte al mejor formato y se sirven responsive. Es el sistema oficial de optimización (ADR B.3).

### 16.3 WebP y AVIF

Se sirve AVIF cuando el navegador lo soporta, con WebP como alternativa y el original como fallback. Astro Image maneja la negociación.

### 16.4 Responsive Images

Se usan `<picture>`/`srcset` generados por Astro con tamaños adaptados a cada punto de interrupción de layout (mobile-first), para no descargar más peso del necesario.

### 16.5 Lazy Loading

- Las imágenes por debajo del pliegue se cargan de forma diferida (`loading="lazy"`).
- La imagen del LCP se precarga con `fetchpriority="high"` para optimizar el Core Web Vital (invigilado para no degradar; ver sección 19).

### 16.6 Alt

Toda imagen relevante lleva un texto alternativo (alt) descriptivo que transmite el contenido. Contribuye a la accesibilidad (sección 18) y al SEO (sección 17).

### 16.7 SEO

Las imágenes contribuyen al SEO con alt correctos, nombres de archivo descriptivos, y uso de `og:image` para compartir en redes (ver sección 17 y `11_SEO.md`).

### 16.8 CDN

Las imágenes optimizadas se sirven a través de la CDN de Vercel/Supabase Storage para latencia baja. La cache se gestiona con cabeceras de caché correctas por tipo de imagen (contenido inmutable = caché larga).

### 16.9 Compresión

Se balancea calidad visual y tamaño: la compresión se ajusta para mantener fidelidad (importante para transmitir el detalle del crochet) manteniendo el peso controlado (objetivos de `12_PERFORMANCE.md`).

---

## 17. SEO

### 17.1 Arquitectura preparada para SEO

La arquitectura es SEO-first (sección 5.11): el catálogo público es HTML estático y índexable gracias a Astro SSG, con metadata completa y estructura limpia.

### 17.2 Metadata

- Metadata global (título, descripción, idioma) con patrón por tipo de página (home, catálogo, ficha, blog).
- Metadata por página generada a partir de los datos (título del producto, descripción, keywords contextuales).

### 17.3 Open Graph

Toda página pública emite tags de Open Graph (`og:title`, `og:description`, `og:image`, `og:url`), relevantes para el compartido en redes (importante dado el canal de Instagram de la marca).

### 17.4 Twitter Cards

Se emiten Twitter Cards (`summary_large_image` para contenidos destacados). Complementario sin prioridad exclusiva.

### 17.5 Schema.org

Se aplica Schema.org estructurado donde aporta: `Product`, `Organization`, `BreadcrumbList`, `FAQPage` (si hay FAQ), y posteriormente `Review` al existir reseñas. Enriquecimiento para Rich Results (ver `11_SEO.md`).

### 17.6 Breadcrumbs

Se mantienen migas de pan (breadcrumbs) coherentes en catálogo y fichas, tanto para UX como para los datos estructurados.

### 17.7 URLs

URLs limpias, descriptivas y permanentes (sección 10). Slugs estables y canonical por página.

### 17.8 Sitemap y robots

- Sitemap automático de rutas públicas (Astro genera el sitemap integrado).
- `robots.txt` que permite rastrear lo público y excluye el panel admin y páginas privadas.

### 17.9 Canonical

Cada página pública emite su canonical para evitar contenido duplicado (ver sección 10.7). Se usa el dominio canónico oficial.

### 17.10 Performance

El SEO está ligado al rendimiento (Core Web Vitals): LCP, CLS, INP y TTFB se monitorean y se mantienen dentro de objetivos (sección 19).

### 17.11 Detail

Todos los detalles técnicos, incluyendo el blog y las colecciones, se desarrollan en `11_SEO.md`.

---

## 18. Accesibilidad

### 18.1 WCAG

El sitio debe cumplir WCAG AA como estándar (nivel de cumplimiento oficial). Toda funcionalidad se diseña accesible desde el origen (Accessibility First, sección 5.9).

### 18.2 ARIA

Se usa ARIA de forma correcta y solo donde aporta: roles y atributos en widgets (menús, drawers, carruseles, modales, toasts) provistos por shadcn/ui/Radix y verificados. ARIA nunca sustituye a una semántica HTML adecuada.

### 18.3 Contraste

Los colores de texto y de interacción cumplen contraste WCAG. Los colores semánticos con el rosa principal se ajustan para garantizar contraste según contexto (ADR B.1 y `DESIGN_SYSTEM.md`). El contraste se verifica en QA.

### 18.4 Teclado

Toda la funcionalidad es operable por teclado: navegación visible del foco, orden lógico de tabulación, cierre de overlays con Escape, y bounds de foco.

### 18.5 Lectores de pantalla

La estructura semántica (headings, landmarks, labels) permite la navegación con lectores. Los formularios tienen labels asociadas; las imágenes, alt (sección 16.6); los estados de carga y errores se anuncian de forma accesible.

### 18.6 Focus

El foco es visible y coherente con la identidad (respetando contraste). Los modales/drawers gestionan el movimiento y el bloqueo de foco de forma accesible.

### 18.7 Motion Reduction

Se respeta `prefers-reduced-motion`: las animaciones de marca (ver `09_ANIMATION_SYSTEM.md`) se reducen o eliminan según la preferencia del usuario, sin perder información.

### 18.8 Responsive

La accesibilidad considera también el diseño responsive (mobile-first) y el soporte táctil (tamaños de control, espaciado).

---

## 19. Rendimiento

El rendimiento es un requisito de arquitectura con objetivos medibles (ADR y `12_PERFORMANCE.md`). La arquitectura favorece el rendimiento estructuralmente.

### 19.1 LCP (Largest Contentful Paint)

- La imagen principal del hero y de las fichas se precarga (`fetchpriority="high"`).
- Se evita bloqueo del render por fuentes o scripts (optimización de fuentes, sección 19.9).
- Objetivo: LCP dentro del buen rango (ver `12_PERFORMANCE.md`).

### 19.2 CLS (Cumulative Layout Shift)

- Imágenes con dimensiones reservadas; evitar saltos de layout.
- Fuentes con métricas correctas y `font-display`/adaptado para no provocar desplazamiento.
- Objetivo: CLS nulo o mínimo.

### 19.3 FID / INP

- La interactividad principal (submit, filtros) responde rápido; el JavaScript mínimo (islas) reduce el INP.
- Se evitan procesos largos en el main thread.

### 19.4 TTFB

- SSG con CDN reduce el tiempo hasta el primer byte (contenido servido desde edge/borde).

### 19.5 Lazy Loading

Se difieren recursos no críticos (imágenes bajo el pliegue, islas con `client:visible`, scripts no esenciales).

### 19.6 Code Splitting

Astro separa el bundle por página; las islas cargan solo su JavaScript. No se hiffrons de una SPA.

### 19.7 Tree Shaking

Se importan solo las APIs usadas de cada librería (Lucide React, componentes shadcn). El bundle se mantiene mínimo.

### 19.8 Prefetch y Preload

- Prefetch de recursos de alta probabilidad de navegación (Astro prefetch en enlaces relevantes).
- Preload de recursos críticos (LCP, fuentes).

### 19.9 Caching

Cabeceras de caché para contenido estático inmutable (imágenes, assets) y estrategias de revalidación para datos (TanStack Query). Sin obviar la coherencia de datos.

### 19.10 Image Optimization

Sección 16: AVIF/WebP, responsive, lazy/ eager según posición.

### 19.11 Bundle Size

Se monitorea el tamaño del bundle por página; se fija un objetivo y un límite de guarda (ver `12_PERFORMANCE.md` y `13_DEPLOYMENT.md`).

### 19.12 Hydration mínima

El principio core de Astro Islands: se hidrata solo lo necesario (sección 7.6), lo que reduce el JavaScript total y mejora LCP e INP. La "hydration mínima" es el mitón principal para este objetivo.

---

## 20. Escalabilidad

### 20.1 Cómo crecer sin romper la arquitectura

La escalabilidad se conquista con: modelo de datos extensible (ver `05_DATABASE.md`), modularidad de código (sección 9), sistema de diseño extensible (`10_UI_COMPONENTS.md`), y políticas de datos/seguridad por capas. Las dimensiones de crecimiento:

### 20.2 Más productos

El modelo separa producto/categoría/colección/variante/stock; añadir productos es un cambio de datos, no de arquitectura. El catálogo puede pre-renderizarse en build para seguir siendo rápido a gran escala (ADR C.2).

### 20.3 Más administradores

El modelo tiene un único rol administrativo; añadir una administradora es añadir un usuario con ese rol, sin tocar la autorización (ADR A.2).

### 20.4 Más categorías y colecciones

Son entidades de datos; el sistema de navegación las soporta sin rediseño.

### 20.5 Más idiomas

Los textos están preparados para i18n (ADR C.3 y `05_DATABASE.md`), aunque la internacionalización se implementa en una fase posterior (ver `15_ROADMAP.md`).

### 20.6 Más países

Requiere evolución de envíos y, en su momento, moneda; el modelo de pedido reserva la abstracción sin implementar en el MVP (ver `08_ECOMMERCE_FLOW.md`).

### 20.7 Más monedas

Se reserva en la arquitectura de precios (modelo de datos extensible) sin implementar ahora (YAGNI; ver `05_DATABASE.md`).

### 20.8 Más integraciones

La capa de servicios aísla las integraciones (WhatsApp, futura pasarela, envíos). Añadir una integración es añadir un servicio, sin tocar el dominio.

### 20.9 Más tráfico

Frontend: SSG + CDN escala el tráfico de lectura de forma casi ilimitada. Backend: Supabase gestiona la escala; la lectura pública se sirve en gran parte desde CDN/build. Los cuellos de botella (escrituras admin) se mitigan con capa de datos bien diseñada (ver `05_DATABASE.md`).

### 20.10 Decisión de escala

Cada fase del roadmap concreta un punto de escala (ver `15_ROADMAP.md`). El diseño actual escaliza el catálogo y el modelo de negocio; la escala de infraestructura se ajusta con la operación (monitoreo, ADR futuros).

---

## 21. Preparación para IA

Este proyecto se desarrolla con colaboración de IA. La arquitectura debe ser especialmente clara para que la IA no la rompa. Esta sección define cómo colaborar de forma segura con IA.

### 21.1 Cómo deben escribirse los prompts

- Contextualizar: referenciar los documentos pertinentes (este documento, `04_FOLDER_STRUCTURE.md`, `14_CODING_STANDARDS.md`) al delegar.
- Pedir cambios acotados y verificables, no "rediseña todo".
- Solicitar respetar las capas y evitar accesos directos a Supabase (ADR A.5).
- Pedir justificar las decisiones y abrir ADR ante ambigüedad en vez de resolver calladamente.
- Preguntar por desviaciones antes de aplicarlas.

### 21.2 Cómo dividir tareas

- Dividir en unidades pequeñas por dominio/feature (sección 9).
- Cada tarea tiene un objetivo claro, un alcance definido y criterios de aceptación.
- Las islas interactivas se separan del contenido estático para no mezclar rendimiento y lógica.

### 21.3 Cómo mantener consistencia

- Usar los componentes y tokens oficiales de `10_UI_COMPONENTS.md` y `DESIGN_SYSTEM.md`.
- Seguir las convenciones de `14_CODING_STANDARDS.md`.
- Añadir código en la estructura definida de `04_FOLDER_STRUCTURE.md`; nunca romper la organización con "atajos".

### 21.4 Cómo documentar cambios

- Registrar en el ADR las decisiones que afecten a la arquitectura (sección 22).
- Actualizar documentación al agregar funcionalidad; la fuente única de verdad debe reflejar el estado real.
- Commits/PRs descritos con claridad (ver `14_CODING_STANDARDS.md` y `13_DEPLOYMENT.md`).

### 21.5 Cómo evitar que la IA rompa la arquitectura

- Regla inviolable: implementar dentro de las capas (sección 8); nada de acceso directo a Supabase desde componentes (ADR A.5), nada de lógica de negocio en UI.
- Revisar que no se dupliquen servicios ni se introduzcan librerías fuera del stack (ver `03_TECH_STACK.md`, librerías prohibidas).
- Sintaxis y types estrictos; no aceptar `any` sin justificación (sección 5.7, `14_CODING_STANDARDS.md`).

### 21.6 Cómo revisar PRs generados por IA

- Revisar contra las capas y los principios de esta sección.
- Verificar ausencia de secretos y de datos sensibles (sección 15).
- Comprobar rendimiento bundler (islas, bundle) y accesibilidad básica.
- Ejecutar los checks de calidad definidos (typecheck, lint, tests—ver `14_CODING_STANDARDS.md`).
- Aplicar la regla de no-gigantismo y separación de responsabilidades.

### 21.7 Cómo mantener contexto

- Documentación viva como única fuente de verdad (este conjunto).
- Resúmenes claros del estado en cada entrega.
- Registro de ADR y decisiones para recontextualizar a IA al seguir, sin depender de memoria volátil.

---

## 22. Architectural Decisions (ADR)

Esta sección registra las **decisiones irreversibles** o de alto impacto del proyecto. Establecen reglas que perduran. Cada ADR sigue el formato oficial. Las decisiones aquí contenidas ya fueron aprobadas en la revisión de la visión y sus directrices; se formalizan aquí como referencia técnica.

### ADR A.1 — Separación de estado: Zustand (client) y TanStack Query (server)

- **Contexto:** la arquitectura necesita manejar datos remotos (server state) y estado local de interfaz (client state). Sin separación, se genera acoplamiento y código difícil de mantener.
- **Problema:** cómo gestionar dos tipos de estado distintos sin mezclar responsabilidades.
- **Alternativas consideradas:** (a) Zustand para ambos; (b) TanStack Query para ambos; (c) separación estricta (elegida).
- **Decisión tomada:** TanStack Query administra exclusivamente server state; Zustand administra exclusivamente client state.
- **Justificación:** cada herramienta es experta en su dominio; la separación sigue SRP (sección 5) y simplifica el mantenimiento. Ver sección 8.
- **Consecuencias positivas:** claridad, menor acoplamiento, herramientas optimizadas para cada caso.
- **Consecuencias negativas:** dos librerías de estado y la disciplina de seguir la regla.
- **Impacto futuro:** la regla es permanente; toda evolución debe respetarla.

### ADR A.2 — Un único rol administrativo, sin jerarquías

- **Contexto:** existen dos administradoras (Kaili y Dayna) en un emprendimiento familiar.
- **Problema:** definir un modelo de roles sin complejidad innecesaria y sostenible al crecer.
- **Alternativas consideradas:** (a) múltiples roles con jerarquías (SuperAdmin/Editor); (b) un único rol administrativo (elegido).
- **Decisión tomada:** existe solo el rol "administrador". Kaili y Dayna son usuarios con ese rol y los mismos permisos. No hay SuperAdmin ni Editor.
- **Justificación:** simplicidad (KISS), suficiencia para el negocio y facilidad de crecimiento (añadir un admin no toca el modelo). Ver sección 15.7.
- **Consecuencias positivas:** modelo de autorización simple y robusto.
- **Consecuencias negativas:** sin granularidad de permisos (aceptable a esta escala).
- **Impacto futuro:** si se necesitara granularidad, se evoluciona con un ADR.

### ADR A.3 — Checkout sin pago en línea en el MVP, con WhatsApp

- **Contexto:** el negocio opera por WhatsApp; no hay pasarela de pago.
- **Problema:** definir el fin del checkout.
- **Alternativas consideradas:** (a) integrar pasarela en el MVP; (b) concluir con generación de pedido + WhatsApp (elegido).
- **Decisión tomada:** el checkout genera el pedido y abre una conversación de WhatsApp; el pago se coordina manualmente (por ejemplo, Yape). Estados de pedido: Pendiente, Confirmado, En producción, Listo para entregar, Entregado, Cancelado. No existe "Pagado" en el MVP.
- **Justificación:** fidelidad al modelo de negocio real, sin sobre-ingeniería; el estado "Pagado" queda reservado para una futura pasarela. Ver `08_ECOMMERCE_FLOW.md`.
- **Consecuencias positivas:** MVP enfocado y honesto; flujo de valor cerrado.
- **Consecuencias negativas:** sin cobro online automático; requiere coordinación manual.
- **Impacto futuro:** el esquema reserva la abstracción para integrar pagos sin romper pedidos.

### ADR A.4 — Sin cuentas de cliente en el MVP; clientes derivados de pedidos

- **Contexto:** el cliente público compra sin registro.
- **Problema:** cómo modelar "clientes".
- **Alternativas consideradas:** (a) autenticación de cliente desde el inicio; (b) clientes como registros derivados de pedidos (elegido).
- **Decisión tomada:** no hay cuentas de cliente en el MVP; el cliente puede comprar sin registrarse. La entidad "cliente" se deriva de los pedidos.
- **Justificación:** reduce fricción de compra y complejidad del MVP (KISS); el registro futuro no romperá el modelo. Ver `05_DATABASE.md` y `08_ECOMMERCE_FLOW.md`.
- **Consecuencias positivas:** compra ágil y sin barreras.
- **Consecuencias negativas:** sin atributos de cuenta propios en el MVP.
- **Impacto futuro:** se prevé la evolución hacia registro, sin reescritura destructiva.

### ADR A.5 — Acceso a datos solo mediante servicios; prohibido el acceso directo desde componentes

- **Contexto:** evitar el acoplamiento de la UI con Supabase.
- **Problema:** cómo acceder a datos sin generar código espagueti.
- **Alternativas consideradas:** (a) acceso libre desde cualquier componente; (b) capa de servicios obligatoria (elegido).
- **Decisión tomada:** ningún componente accede a Supabase directamente; todo el acceso pasa por la capa de servicios. Ver secciones 8 y 11.
- **Justificación:** aísla la infraestructura, facilita pruebas y evita la mezcla de lógica (SRP). Ver `04_FOLDER_STRUCTURE.md`.
- **Consecuencias positivas:** bajo acoplamiento, testabilidad, consistencia.
- **Consecuencias negativas:** una capa más que respetar.
- **Impacto futuro:** nuevas integraciones se añaden como servicios, sin tocar componentes.

### ADR A.6 — Rol de la identidad en el comportamiento y el movimiento

- **Contexto:** la identidad artesanal depende de comportamiento y de imagen, no solo de colores.
- **Problema:** garantizar WCAG sin perder identidad visual.
- **Alternativas consideradas:** (a) bajar el rosa principal; (b) crear colores semánticos con contraste suficiente según contexto (elegido); ver ADR B.1.
- **Decisión tomada:** el rosa principal permanece como color de identidad; se usan tokens semánticos (Brand Primary/Dark/Soft/Surface/Accent) que garantizan el contraste adecuado para texto e interacción.
- **Justificación:** preservar marca y cumplir accesibilidad (sección 18). Ver `DESIGN_SYSTEM.md`.
- **Consecuencias positivas:** identidad intacta y accesibilidad asegurada.
- **Consecuencias negativas:** necesidad de un sistema de tokens definido (se resuelve en `10_UI_COMPONENTS.md`).
- **Impacto futuro:** la marca evoluciona vía tokens sin refactor de componentes.

### ADR B.1 — Colores semánticos para accesibilidad (contraste)

- **Contexto:** el rosa principal `#F25F9D` no alcanza WCAG AA para texto normal (≈3:1).
- **Problema:** texto e interacción legibles sin romper la identidad.
- **Alternativas consideradas:** (a) modificar el rosa; (b) tokens semánticos con variante oscura para texto (elegido).
- **Decisión tomada:** se definen tokens semánticos; el texto sobre superficies claras usa la variante oscura con contraste ≥4.5:1; el rosa claro se reserva para grandes elementos decorativos. Ver `DESIGN_SYSTEM.md` y `10_UI_COMPONENTS.md`.
- **Justificación:** cumplir WCAG AA (sección 18) preservando la identidad.
- **Consecuencias positivas:** accesibilidad y legibilidad garantizadas.
- **Consecuencias negativas:** complejidad adicional de tokens (gestionable).
- **Impacto futuro:** toda decisión de color debe validar contraste.

### ADR B.3 — Astro Image como sistema oficial de optimización de imágenes

- **Contexto:** la fotografía es protagonista y el rendimiento es crítico.
- **Problema:** optimizar imágenes sin sacrificar calidad ni rendimiento.
- **Alternativas consideradas:** (a) imágenes manuales por editor; (b) Astro Image (elegido).
- **Decisión tomada:** se usa Astro Image para la optimización, el responsive y los formatos modernos (AVIF/WebP). Ver sección 16.
- **Justificación:** automatización, rendimiento y CDN con un único mecanismo coherente.
- **Consecuencias positivas:** imágenes óptimas automáticamente; LCP controlado.
- **Consecuencias negativas:** depende de la integración de Astro (soportada).
- **Impacto futuro:** nuevas imágenes siguen el mismo pipeline.

### ADR B.4 — Sin PWA en el MVP

- **Contexto:** el carrito necesita persistencia sin depender del servidor.
- **Problema:** cómo mantener el carrito sin una PWA compleja.
- **Alternativas consideradas:** (a) PWA/Service Worker en el MVP; (b) persistencia en `localStorage` vía Zustand (elegido).
- **Decisión tomada:** el carrito se persiste en `localStorage` mediante Zustand. No hay PWA en el MVP; se documenta como evolución (ver `15_ROADMAP.md`).
- **Justificación:** resolver la necesidad real con la menor complejidad (YAGNI/KISS) sin interrumpir la experiencia.
- **Consecuencias positivas:** MVP sencillo y offline básico del carrito.
- **Consecuencias negativas:** sin funcionalidades PWA completas.
- **Impacto futuro:** si se requieren características offline completas, se evalúa PWA con un ADR.

### ADR B.5 — Minimización de datos

- **Contexto:** la privacidad es prioridad; no se guarda información innecesaria.
- **Problema:** qué datos almacenar.
- **Alternativas consideradas:** (a) capturar el máximo de datos; (b) minimizar a lo estrictamente necesario (elegido).
- **Decisión tomada:** se almacena solo lo necesario para gestionar pedidos; no se registra contenido de conversaciones de WhatsApp ni datos sensibles. Ver secciones 14 y 15.
- **Justificación:** privacidad, seguridad y confianza (ver `01_PROJECT_VISION.md`).
- **Consecuencias positivas:** menor riesgo, menor superficie de ataque, confianza.
- **Consecuencias negativas:** menos datos para analytics.
- **Impacto futuro:** regla permanente para cualquier integración.

### ADR C.1 — Clientes sin cuenta; registro futuro previsto

- **Contexto:** se confirma el modelo de clientes en el MVP.
- **Decisión:** sin cuentas de cliente; clientes derivados de pedidos; se prevé registro futuro sin romper el modelo. Ver A.4 y `05_DATABASE.md`.

### ADR C.2 — Estrategia de datos: SSG/SEO vs. interactividad

- **Contexto:** hay contenido público índexable y datos dinámicos.
- **Problema:** dónde fetchear cada dato.
- **Alternativas consideradas:** (a) todo en el cliente (CSR); (b) todo en build (SSG); (c) híbrido: SSG público + islas/TanStack para datos vivos (elegido).
- **Decisión tomada:** Astro renderiza el público (SEO en build); las islas React y TanStack Query gestionan datos dinámicos (filtros, carrito reactivo, admin). Se contempla pre-renderizar el catálogo en build para maximizar el SEO (ver secciones 7.13 y 20.2).
- **Justificación:** alinea SEO (primera capa de la visión) con interactividad (segunda) sin sacrificar ninguno. Ver secciones 7 y 8.
- **Consecuencias positivas:** rendimiento e índice de primeras; interactividad donde aporta.
- **Consecuencias negativas:** coexistencia de dos paradigmas (definida claramente).
- **Impacto futuro:** base de la lectura del sistema de datos (sección 11).

### ADR C.3 — Soporte de internacionalización reservado (sin implementar en el MVP)

- **Contexto:** internacionalización prevista en una fase futura.
- **Problema:** preparar el terreno sin implementar hoy.
- **Alternativas consideradas:** (a) ignorar i18n; (b) reservar el modelo (elegido).
- **Decisión tomada:** el modelo de datos y textos se reserva para i18n (ver `05_DATABASE.md`), aunque no se implementa en el MVP (YAGNI).
- **Justificación:** evitar reescrituras futuras manteniendo la simplicidad presente.
- **Consecuencias positivas:** crecimiento limpio hacia multilenguaje.
- **Consecuencias negativas:** define campos adicionales en el modelo desde el inicio.
- **Impacto futuro:** la internacionalización se construye sobre el modelo sin romperlo.

### ADR C.4 — Blog con Astro Content Collections

- **Contexto:** se incorpora blog para contenido editorial (ver `01_PROJECT_VISION.md` sección 15).
- **Problema:** cómo gestionar el contenido del blog.
- **Alternativas consideradas:** (a) CMS externo; (b) Astro Content Collections (elegido).
- **Decisión tomada:** el blog usa Astro Content Collections (contenido tipado en el repositorio). No se incorpora un CMS externo hasta que haya necesidad real (ver `15_ROADMAP.md`).
- **Justificación:** sencillez, control, rendimiento y ausencia de dependencia inicial.
- **Consecuencias positivas:** contenido tipado y con control de versiones; integración con la arquitectura.
- **Consecuencias negativas:** a muy gran escala podría requerir un CMS (fase posterior).
- **Impacto futuro:** si el volumen lo exige, se evalúa un CMS con un ADR.

### ADR D.1 — El rol del movimiento en la identidad

- **Contexto:** la identidad artesanal se refleja también en el comportamiento de la interfaz.
- **Problema:** definir el sistema de movimiento sin que parezca infantil ni exagerado.
- **Alternativas consideradas:** (a) animaciones decorativas libres; (b) sistema de movimiento físico, elegante y contenido (elegido).
- **Decisión tomada:** las animaciones emulan materiales físicos (un ovillo que rueda, un hilo que se tensa, una tela que cae) con duraciones, curvas y casos exactos especificados en `09_ANIMATION_SYSTEM.md`, respetando `prefers-reduced-motion`.
- **Justificación:** frescura y elegancia, alineadas con la marca y con el rendimiento y la accesibilidad (secciones 18 y 19).
- **Consecuencias positivas:** identidad memorable y coherente.
- **Consecuencias negativas:** requiere especificación precisa (desarrollada en `09_ANIMATION_SYSTEM.md`).
- **Impacto futuro:** el sistema de movimiento es parte del design system y evoluciona con él.

---

## 23. Quality Attributes

Los atributos de calidad definen los criterios con los que se evalúa la arquitectura. Cada uno explica cómo influye en las decisiones arquitectónicas.

### 23.1 Escalabilidad

**Definición:** capacidad de crecer en datos, funciones, alcance y tráfico sin reescrituras destructivas. **Cómo influye:** modelo de datos extensible (sección 20), modularidad (sección 9) y pre-renderización del catálogo. Cada decisión se valida contra el principio de evolución (sección 26).

### 23.2 Mantenibilidad

**Definición:** facilidad de comprender, modificar y ampliar. **Cómo influye:** convenciones (sección 5 y `14_CODING_STANDARDS.md`), estructura predecible (sección 9) y componentes pequeños. Una arquitectura no mantenible convierte cada cambio en un riesgo.

### 23.3 Extensibilidad

**Definición:** capacidad de añadir funcionalidad nueva con bajo impacto. **Cómo influye:** módulos por dominio/feature, capa de servicios y composición (sección 5). Añadir una colección o un idioma no exige rehacer el sistema.

### 23.4 Rendimiento

**Definición:** velocidad de carga y fluidez de interacción. **Cómo influye:** SSG (frontend), islas e hidratación mínima, imágenes optimizadas y prevención de CLS (sección 19). El rendimiento es criterio de aceptación (sección 28).

### 23.5 Seguridad

**Definición:** protección contra amenazas y fuga de datos. **Cómo influye:** capas de validación, RLS, secretos por variables de entorno y minimización de datos (sección 15). La seguridad es transversal y no negociable.

### 23.6 Accesibilidad

**Definición:** usabilidad para todas las personas. **Cómo influye:** WCAG AA, teclado, contraste y motion reduction (sección 18). Se evalúa en cada componente y flujo.

### 23.7 Disponibilidad

**Definición:** el servicio está operativo cuando se necesita. **Cómo influye:** SSG + CDN (lectura resiliente), hostings gestionados (Supabase/Vercel) y política de backups (sección 6.12). Disponibilidad razonable para la escala del negocio.

### 23.8 Confiabilidad

**Definición:** el sistema hace lo que promete de forma consistente. **Cómo influye:** manejo de errores riguroso (sección 13), tipos y validación (sección 12) y pruebas (ver `14_CODING_STANDARDS.md`). Confiable en los flujos de pedido y admin, que son críticos.

### 23.9 Observabilidad

**Definición:** capacidad de conocer el estado interno del sistema. **Cómo influye:** sistema de logs con severidad y privacidad (sección 14), monitoreo en despliegue (ver `13_DEPLOYMENT.md`) y analytics limitados (sección 6.10). Permite corregir de forma proactiva, no reactiva.

### 23.10 Testabilidad

**Definición:** facilidad de probar el comportamiento. **Cómo influye:** capa de servicios desacoplada (ADR A.5), tipos compartidos y convenciones de testing (`14_CODING_STANDARDS.md`). Un sistema testeable es un sistema que puede evolucionar con confianza.

### 23.11 Reutilización

**Definición:** aprovechar implementaciones únicas. **Cómo influye:** componentes reutilizables, servicios únicos y esquemas compartidos (secciones 3–8). Reuso sin forzar acoplamientos frágiles.

### 23.12 Simplicidad

**Definición:** mínima complejidad que resuelve el requisito. **Cómo influye:** KISS/YAGNI (sección 5), evitando la sobre-ingeniería. Un sistema simple es más mantenible y extensible.

### 23.13 Consistencia

**Definición:** uniformidad de decisiones y patrones. **Cómo influye:** convenciones, sistema de diseño y flujos de datos estándar. La consistencia reduce deuda y mejora la colaboración (sección 21).

Estos atributos definen la "definición de hecho" de la arquitectura. La autoevaluación de la sección 28 verifica su cumplimiento respecto a los objetivos de la visión.

---

## 24. Riesgos arquitectónicos

La arquitectura es preventiva: identifica riesgos, su probabilidad, impacto, mitigación y contingencia. Esta matriz se revisa en cada fase (ver `15_ROADMAP.md`).

### R-1 · Crecimiento del catálogo degradando el rendimiento de lectura

- **Descripción:** al multiplicarse los productos, el catálogo en build podría crecer y afectar el tiempo de build y la coherencia de datos.
- **Probabilidad:** Media.
- **Impacto:** Medio (rendimiento, SEO si no se controla).
- **Mitigación:** pre-renderización guiada, filtros eficientes y CDN y caché (secciones 19 y 20).
- **Plan de contingencia:** pasar a renderizado incremental o caché de borde para las fichas más visitadas.

### R-2 · Error o inconsistencia en el flujo sin pago (pedidos por WhatsApp)

- **Descripción:** al no haber pago automatizado, el flujo depende de la coordinación manual; pueden generarse estados de pedido inconsistentes o pérdida de seguimiento.
- **Probabilidad:** Media.
- **Impacto:** Alto (confianza del cliente).
- **Mitigación:** estados de pedido claros, confirmación inmediata y visibilidad del estado para la administración (ver `08_ECOMMERCE_FLOW.md`).
- **Plan de contingencia:** ante fallo en la generación del pedido, permitir el reingreso y conservar el carrito en `localStorage`; notificación de administración.

### R-3 · Contraste de color que incumpla WCAG en usos no previstos

- **Descripción:** el rosa principal en textos o sobre superficies claras podría incumplir contraste si no se aplican los tokens semánticos.
- **Probabilidad:** Baja, si se sigue ADR B.1.
- **Impacto:** Medio (accesibilidad).
- **Mitigación:** tokens semánticos obligatorios y verificación de contraste en QA (sección 18).
- **Plan de contingencia:** revisión y ajuste del token en caso de detección.

### R-4 · Sobrecarga de JavaScript por mal uso de islas

- **Descripción:** si se hidratan demasiadas islas o se emplea React/Framer indiscriminadamente, crece el bundle y se degrada el rendimiento.
- **Probabilidad:** Media.
- **Impacto:** Alto (Core Web Vitals).
- **Mitigación:** política de hidratación mínima (sección 7.6), límites de bundle y revisión en PR (sección 21).
- **Plan de contingencia:** mover contenido estático de las islas a Astro y reducir dependencias (sección 19).

### R-5 · Fuga de secretos o datos sensibles

- **Descripción:** una clave expuesta o un log con datos personales compromete la seguridad y la confianza.
- **Probabilidad:** Baja.
- **Impacto:** Alto.
- **Mitigación:** variables de entorno, prohibición de registrar datos sensibles (secciones 14 y 15) y revisión de PR.
- **Plan de contingencia:** rotar credenciales y corregir el registro de logs de inmediato.

### R-6 · Deuda técnica por acumulación de atajos en el crecimiento

- **Descripción:** al incorporar funcionalidades y colaboraciones de IA sin disciplina, se acumula código espagueti y componentes gigantes.
- **Probabilidad:** Media.
- **Impacto:** Alto (mantenibilidad y evolución).
- **Mitigación:** Technical Debt Policy (sección 25), revisión rigurosa de PRs y ADR para desviaciones.
- **Plan de contingencia:** ventanas de refactor priorizadas por la política de deuda.

### R-7 · Cambio de requisitos de integración (pasarela de pagos futura)

- **Descripción:** cuando se integre una pasarela, podría forzarse un cambio estructural.
- **Probabilidad:** Media (fase futura).
- **Impacto:** Medio.
- **Mitigación:** abstracción de la capa de servicios y modelo de pedido extensible (ADRs A.3 y C.3).
- **Plan de contingencia:** evolución de estados de pedido con un ADR, sin romper el modelo existente.

---

## 25. Technical Debt Policy

### 25.1 Qué deuda aceptaremos

- Deuda **documentada y con plan** de resolución futura.
- Deuda **acotada y reversible** que permite avanzar el MVP sin bloquear (p. ej., `TODO` localizados con referencia a una tarea o ADR).
- Aplazamientos que preservan el principio de evolución (sección 26) y se registran en el backlog.

### 25.2 Qué deuda nunca aceptaremos

- Código que rompe la separación de responsabilidades o mezcla lógica de negocio con UI.
- Accesos directos a Supabase desde componentes.
- Componentes gigantes no divididos.
- Duplicación de lógica sin justificación.
- Ignorar TypeScript (uso de `any` sistemático) sin causa documentada.
- Desactivación de validaciones.
- Inobservancia de accesibilidad o rendimiento.
- Decisiones no documentadas (sin ADR) que contradicen la arquitectura.
- Librerías fuera del stack oficial sin aprobación.

### 25.3 Cómo documentarla

- Toda deuda aceptada se registra con: descripción, ubicación, razón del aplazamiento, impacto y plan/owner de resolución.
- Las decisiones que introducen deuda estructural se registran como ADR (sección 22).
- Se mantiene una sección o backlog de deuda por módulo en la documentación (ver `15_ROADMAP.md`).

### 25.4 Cómo priorizar su resolución

Prioridad por impacto en **riesgo, mantenibilidad y evolución**:
1. Deuda que bloquea cambios o crecimiento.
2. Deuda que introduce bugs o incoherencias de datos.
3. Deuda que afecta rendimiento, accesibilidad o seguridad.
4. Deuda estética de bajo impacto (puede esperar).

### 25.5 Cómo evitar que se acumule

- Revisión rigurosa de PRs (sección 21) con la política de "nunca acepto" en mente.
- Definición de "definición de hecho": el código debe pasar typecheck, lint y tests y cumplir las convenciones.
- Ventanas periódicas de reducción de deuda en el roadmap (ver `15_ROADMAP.md`).
- Documentación viva que impida la reconducción a la arquitectura.

---

## 26. Principio de evolución

La arquitectura no se diseña únicamente para el MVP: **debe permitir evolucionar sin reescrituras importantes.**

### 26.1 La pregunta rectora

Toda decisión debe responder ante:

> *"¿Podrá esta decisión seguir siendo válida cuando la tienda tenga diez veces más productos, varios administradores, nuevas categorías y funcionalidades adicionales?"*

### 26.2 Aplicación

- **Modelo de datos:** producto/categoría/colección/variante/stock separados, con reserva i18n (ADR C.3) —válido al escalar.
- **Autorización:** un solo rol, extensible a más administradores (ADR A.2).
- **Rutas y contenido:** sistema de rutas y colecciones extensible.
- **Integraciones:** aisladas en la capa de servicios.

### 26.3 Cuándo se acepta una decisión de MVP aunque falle la prueba

Si una decisión no pasa la prueba pero se considera justificada para el MVP, debe:
1. Documentarse explícitamente (ADR).
2. Explicar por qué es correcta para el MVP.
3. Registrar cómo se resolverá al crecer (riesgo y contingencia, sección 24).
4. No dejarse como deuda silenciosa (sección 25).

**Ejemplo:** la reserva de la pasarela de pagos y de i18n son decisiones que se postergan con plan explícito, no como parches accidentales.

---

## 27. Reglas absolutas — Nunca hacer

Reglas vinculantes de la arquitectura. Su violación exige una decisión formal (ADR) y justificación; nunca se resuelven silenciosamente (raíz de las reglas de la sección 21).

1. **Nunca mezclar lógica de negocio con UI.** *Por qué:* viola SRP y la filosofía de la sección 4.
2. **Nunca acceder a Supabase directamente desde un componente** sin pasar por la capa de servicios. *Por qué:* ADR A.5, bajo acoplamiento.
3. **Nunca duplicar lógica de dominio o servicios.** *Por qué:* DRY y fuente única de verdad.
4. **Nunca crear componentes gigantes.** *Por qué:* se degrada la mantenibilidad y el control sobre el sistema.
5. **Nunca romper la separación de responsabilidades (estado/UI/datos).** *Por qué:* la fuente de datos y el estado deben estar separados (ADR A.1).
6. **Nunca optimizar prematuramente.** *Por qué:* YAGNI/KISS; la complejidad sin necesidad es deuda.
7. **Nunca ignorar TypeScript.** *Por qué:* los `any` sin causa minan la confiabilidad.
8. **Nunca desactivar validaciones.** *Por qué:* la validación en tres capas es una barrera de seguridad y confiabilidad.
9. **Nunca comprometer la accesibilidad por una característica.** *Por qué:* WCAG AA es no negociable.
10. **Nunca exponer secretos ni registrar datos sensibles.** *Por qué:* seguridad y minimización de datos (ADR B.5).
11. **Nunca resolver una desviación de arquitectura silenciosamente; abrir un ADR.** *Por qué:* la documentación es la fuente única de verdad.
12. **Nunca hidratar contenido que debe ser estático e índexable.** *Por qué:* rendimiento y SEO (ADR C.2).
13. **Nunca mezclar TanStack Query y Zustand en el mismo estado.** *Por qué:* ADR A.1.
14. **Nunca introducir librerías fuera del stack oficial sin revisión.** *Por qué:* control del bundle y coherencia (sección 3, `03_TECH_STACK.md`).
15. **Nunca aceptar deuda sin documentar y planificar** (sección 25).

---

## 28. Criterios de aceptación (autoevaluación)

Autoevaluación de este documento respecto a los objetivos definidos en `01_PROJECT_VISION.md`.

| Visión (objetivo) | Cumplido en arquitectura | Verificación |
|---|---|---|
| Vender emociones y valor artesanal | Movimiento físico en la identidad y contenido server-first | ADR D.1, secciones 7 y 8 |
| SEO e indexación del contenido | SSG, canonical, sitemap y metadata | Secciones 7, 10 y 17 |
| Rendimiento fluido | SSG/CDN, hidratación mínima e imágenes | Secciones 7, 16 y 19 |
| Accesibilidad WCAG | Contraste, teclado y motion reduction | Sección 18, ADR B.1 |
| Crecimiento (10x, admin, categorías, idiomas) | Modelo extensible, autorización simple e i18n reservado | Secciones 20 y 26, ADRs A.2 y C.3 |
| Personalización | Flujo de pedido bajo pedido por WhatsApp | Secciones 6 y 11, `08_ECOMMERCE_FLOW.md` |
| Cercanía (WhatsApp) | Contacto integrado en el checkout | Sección 6.7, ADR A.3 |
| Confianza y honestidad | Estados claros, minimización de datos y manejo de errores | Secciones 13, 14 y 15 |
| Mora/arte sin romper la identidad | Movimiento físico y tokens visuales | Secciones 8 y 22 (D.1), `09_ANIMATION_SYSTEM.md` |

**Puntos débiles detectados y cómo fortalecerlos:**
- **Modelo de datos e i18n:** la reserva de internacionalización está especificada a nivel de principio; se concreta en `05_DATABASE.md` (campos traducibles) y en `10_UI_COMPONENTS.md` (patrones internacionalizados). → fortalecer en `05`.
- **Monitoreo proactivo:** la observabilidad se define a alto nivel; se detalla en `13_DEPLOYMENT.md` (métricas, alertas) y en `12_PERFORMANCE.md` (Core Web Vitals). → fortalecer en `12` y `13`.
- **Testing:** definido a nivel de filosofía; se concreta la estrategia en `14_CODING_STANDARDS.md` (qué probar en cada capa). → fortalecer en `14`.
- **Flujo sin pago:** el modelo de pedido por WhatsApp se detalla en `08_ECOMMERCE_FLOW.md`. → fortalecer en `08`.

---

## 29. Cierre: filosofía arquitectónica

La filosofía arquitectónica oficial del proyecto puede resumirse así:

> **Construimos una arquitectura que es a la vez excelente y proporcionada.** Separamos el qué (el dominio artesanal) del cómo (las herramientas), porque así el sistema puede crecer durante años sin reescribirse. Mantenemos la simplicidad del MVP sin sacrificar la capacidad de evolucionar: diseñamos para lo probable, no implementamos lo especulativo, y cada decisión queda documentada para que cualquier persona o IA que lea esta documentación pueda seguir el mismo camino sin adivinar.

La arquitectura no es un fin en sí misma: es el soporte de la experiencia definida en `01_PROJECT_VISION.md`. Toda decisión técnica sirve a la identidad artesanal, al rendimiento, a la accesibilidad y a la confianza. Si una decisión técnica contradeciera la visión, es la decisión técnica la que está mal.

Rechazamos por igual el código espagueti y la sobre-ingeniería. Preferimos capas claras, componentes pequeños, datos bien modelados y decisiones explícitas, como quien teje una pieza a mano: puntada a puntada, con paciencia y sin atajos que la debiliten.

*Fin del documento `02_PROJECT_ARCHITECTURE.md` — v1.0.*

---