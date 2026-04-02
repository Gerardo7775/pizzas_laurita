--
-- PostgreSQL database dump
--

\restrict 7AEIYVrgat0lQqjbBANNZLhjp7cEshqJD7ZRdZns3o4BBxEZy1KoppbdG3vwnDR

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-01 22:11:19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 894 (class 1247 OID 17352)
-- Name: estado_pedido; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_pedido AS ENUM (
    'PENDIENTE',
    'PREPARANDO',
    'HORNEANDO',
    'LISTO_ENTREGA',
    'EN_CAMINO',
    'ENTREGADO',
    'CANCELADO'
);



--
-- TOC entry 897 (class 1247 OID 17368)
-- Name: tipo_servicio; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_servicio AS ENUM (
    'LOCAL',
    'DOMICILIO',
    'PARA_LLEVAR'
);



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 17247)
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);



--
-- TOC entry 221 (class 1259 OID 17246)
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 221
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- TOC entry 232 (class 1259 OID 17330)
-- Name: contenido_paquete; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contenido_paquete (
    id integer NOT NULL,
    paquete_id integer NOT NULL,
    presentacion_id integer,
    cantidad integer DEFAULT 1 NOT NULL,
    categoria_id integer,
    tamano_id integer
);



--
-- TOC entry 231 (class 1259 OID 17329)
-- Name: contenido_paquete_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contenido_paquete_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 231
-- Name: contenido_paquete_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contenido_paquete_id_seq OWNED BY public.contenido_paquete.id;


--
-- TOC entry 236 (class 1259 OID 17394)
-- Name: detalle_pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_pedido (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    paquete_id integer,
    presentacion_id integer,
    parent_detalle_id integer,
    es_mitad_y_mitad boolean DEFAULT false,
    sabor_a_id integer,
    sabor_b_id integer,
    cantidad integer DEFAULT 1 NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    notas_cocina text,
    CONSTRAINT check_item_type CHECK ((((paquete_id IS NOT NULL) AND (presentacion_id IS NULL)) OR ((paquete_id IS NULL) AND (presentacion_id IS NOT NULL))))
);



--
-- TOC entry 235 (class 1259 OID 17393)
-- Name: detalle_pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_pedido_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 235
-- Name: detalle_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_pedido_id_seq OWNED BY public.detalle_pedido.id;


--
-- TOC entry 220 (class 1259 OID 17230)
-- Name: ingredientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredientes (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    unidad_receta character varying(20) CONSTRAINT ingredientes_unidad_medida_not_null NOT NULL,
    stock_actual numeric(10,2) DEFAULT 0.00 NOT NULL,
    stock_minimo numeric(10,2) DEFAULT 0.00 NOT NULL,
    costo_unitario numeric(10,2) DEFAULT 0.00 NOT NULL,
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    unidad_compra character varying(50) DEFAULT 'Pza'::character varying NOT NULL,
    factor_conversion numeric(10,2) DEFAULT 1.00 NOT NULL
);



--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN ingredientes.factor_conversion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ingredientes.factor_conversion IS 'Cuántas unidades_receta equivale 1 unidad_compra. Ej: 1 Barra = 1300 gr';


--
-- TOC entry 219 (class 1259 OID 17229)
-- Name: ingredientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingredientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 219
-- Name: ingredientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredientes_id_seq OWNED BY public.ingredientes.id;


--
-- TOC entry 230 (class 1259 OID 17317)
-- Name: paquetes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paquetes (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    precio_paquete numeric(10,2) NOT NULL,
    activo boolean DEFAULT true
);



--
-- TOC entry 229 (class 1259 OID 17316)
-- Name: paquetes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.paquetes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 229
-- Name: paquetes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.paquetes_id_seq OWNED BY public.paquetes.id;


--
-- TOC entry 234 (class 1259 OID 17376)
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    folio character varying(20) NOT NULL,
    cliente_nombre character varying(100),
    cliente_telefono character varying(20),
    tipo_entrega public.tipo_servicio NOT NULL,
    estado public.estado_pedido DEFAULT 'PENDIENTE'::public.estado_pedido,
    tiempo_estimado_min integer NOT NULL,
    total numeric(10,2) DEFAULT 0.00 NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_programada timestamp with time zone,
    motivo_cancelacion text,
    inicio_preparacion timestamp with time zone,
    tiempo_real_min numeric(6,2) DEFAULT NULL::numeric,
    tiempo_excedido_min numeric(6,2) DEFAULT NULL::numeric,
    alerta_retraso character varying(20) DEFAULT 'NORMAL'::character varying,
    fecha_entrega timestamp with time zone
);



--
-- TOC entry 233 (class 1259 OID 17375)
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 233
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- TOC entry 226 (class 1259 OID 17278)
-- Name: presentaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.presentaciones (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    precio numeric(10,2) NOT NULL,
    tamano_id integer NOT NULL
);



--
-- TOC entry 225 (class 1259 OID 17277)
-- Name: presentaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.presentaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 225
-- Name: presentaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.presentaciones_id_seq OWNED BY public.presentaciones.id;


--
-- TOC entry 224 (class 1259 OID 17260)
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    categoria_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    es_mitad_mitad boolean DEFAULT false
);



--
-- TOC entry 223 (class 1259 OID 17259)
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 223
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 228 (class 1259 OID 17294)
-- Name: recetas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recetas (
    id integer NOT NULL,
    presentacion_id integer NOT NULL,
    ingrediente_id integer NOT NULL,
    cantidad_requerida numeric(10,2) NOT NULL
);



--
-- TOC entry 227 (class 1259 OID 17293)
-- Name: recetas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recetas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 227
-- Name: recetas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recetas_id_seq OWNED BY public.recetas.id;


--
-- TOC entry 238 (class 1259 OID 17441)
-- Name: seguimiento_estados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seguimiento_estados (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    estado_registrado public.estado_pedido NOT NULL,
    fecha_hora timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);



--
-- TOC entry 237 (class 1259 OID 17440)
-- Name: seguimiento_estados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seguimiento_estados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 237
-- Name: seguimiento_estados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seguimiento_estados_id_seq OWNED BY public.seguimiento_estados.id;


--
-- TOC entry 240 (class 1259 OID 24667)
-- Name: tamanos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tamanos (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);



--
-- TOC entry 239 (class 1259 OID 24666)
-- Name: tamanos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tamanos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 239
-- Name: tamanos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tamanos_id_seq OWNED BY public.tamanos.id;


--
-- TOC entry 4818 (class 2604 OID 17250)
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 17333)
-- Name: contenido_paquete id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contenido_paquete ALTER COLUMN id SET DEFAULT nextval('public.contenido_paquete_id_seq'::regclass);


--
-- TOC entry 4835 (class 2604 OID 17397)
-- Name: detalle_pedido id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido ALTER COLUMN id SET DEFAULT nextval('public.detalle_pedido_id_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 17233)
-- Name: ingredientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes ALTER COLUMN id SET DEFAULT nextval('public.ingredientes_id_seq'::regclass);


--
-- TOC entry 4824 (class 2604 OID 17320)
-- Name: paquetes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paquetes ALTER COLUMN id SET DEFAULT nextval('public.paquetes_id_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 17379)
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- TOC entry 4822 (class 2604 OID 17281)
-- Name: presentaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentaciones ALTER COLUMN id SET DEFAULT nextval('public.presentaciones_id_seq'::regclass);


--
-- TOC entry 4819 (class 2604 OID 17263)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 17297)
-- Name: recetas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas ALTER COLUMN id SET DEFAULT nextval('public.recetas_id_seq'::regclass);


--
-- TOC entry 4838 (class 2604 OID 17444)
-- Name: seguimiento_estados id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_estados ALTER COLUMN id SET DEFAULT nextval('public.seguimiento_estados_id_seq'::regclass);


--
-- TOC entry 4840 (class 2604 OID 24670)
-- Name: tamanos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tamanos ALTER COLUMN id SET DEFAULT nextval('public.tamanos_id_seq'::regclass);


--
-- TOC entry 5046 (class 0 OID 17247)
-- Dependencies: 222
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id, nombre, descripcion) FROM stdin;
3	Pizza	\N
4	Bebida	\N
\.


--
-- TOC entry 5056 (class 0 OID 17330)
-- Dependencies: 232
-- Data for Name: contenido_paquete; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contenido_paquete (id, paquete_id, presentacion_id, cantidad, categoria_id, tamano_id) FROM stdin;
3	3	\N	1	3	9
4	3	\N	1	3	9
5	3	10	1	\N	\N
\.


--
-- TOC entry 5060 (class 0 OID 17394)
-- Dependencies: 236
-- Data for Name: detalle_pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_pedido (id, pedido_id, paquete_id, presentacion_id, parent_detalle_id, es_mitad_y_mitad, sabor_a_id, sabor_b_id, cantidad, precio_unitario, subtotal, notas_cocina) FROM stdin;
1	23	3	\N	\N	f	\N	\N	1	499.00	499.00	\N
2	23	\N	5	1	f	\N	\N	1	0.00	0.00	\N
3	23	\N	5	1	f	\N	\N	1	0.00	0.00	\N
4	23	\N	10	1	f	\N	\N	1	0.00	0.00	\N
5	24	\N	8	\N	f	\N	\N	1	249.00	249.00	\N
6	25	\N	7	\N	f	\N	\N	1	249.00	249.00	\N
7	26	\N	10	\N	f	\N	\N	1	45.00	45.00	\N
8	27	\N	10	\N	f	\N	\N	1	45.00	45.00	\N
9	27	\N	5	\N	f	\N	\N	1	249.00	249.00	\N
10	28	\N	7	\N	f	\N	\N	1	249.00	249.00	\N
11	29	\N	5	\N	f	\N	\N	1	249.00	249.00	\N
12	30	\N	7	\N	f	\N	\N	1	249.00	249.00	\N
13	31	\N	8	\N	f	\N	\N	1	249.00	249.00	\N
14	32	\N	7	\N	f	\N	\N	1	249.00	249.00	\N
15	32	\N	7	\N	f	\N	\N	1	249.00	249.00	\N
\.


--
-- TOC entry 5044 (class 0 OID 17230)
-- Dependencies: 220
-- Data for Name: ingredientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredientes (id, nombre, unidad_receta, stock_actual, stock_minimo, costo_unitario, ultima_actualizacion, unidad_compra, factor_conversion) FROM stdin;
8	Barra de Queso Chihuahua 	gr	2200.00	2000.00	230.00	2026-03-30 21:26:16.713816	Barra	2200.00
9	Barra de queso Chilchota	gr	2200.00	2000.00	240.00	2026-03-30 21:32:55.180964	Barra	2200.00
11	Tortilla Grande	pza	13.00	5.00	0.00	2026-03-30 21:54:30.931253	Pza	1.00
12	Tortilla Mediana	pza	4.00	5.00	0.00	2026-03-30 21:54:54.436437	Pza	1.00
13	Piña	gr	1000.00	500.00	0.00	2026-03-30 22:04:15.651984	Pza	1000.00
14	Peperoni	gr	900.00	400.00	0.00	2026-03-30 22:09:26.448894	Bolsa	500.00
15	Tortilla Familiar	pza	17.00	5.00	0.00	2026-03-31 00:58:08.908959	Pza	1.00
16	Caja grande	pza	68.00	10.00	0.00	2026-03-31 01:19:14.550102	Pza	1.00
17	Caja Familiar	pza	45.00	10.00	0.00	2026-03-31 01:19:39.054894	Caja	1.00
18	Caja mediana 	pza	48.00	10.00	0.00	2026-03-31 01:19:58.826931	Caja	1.00
19	Pure	ml	700.00	300.00	22.00	2026-03-31 01:21:00.307953	Caja	1000.00
20	Jamon	gr	1000.00	500.00	380.00	2026-03-31 01:22:57.638327	Barra	1800.00
\.


--
-- TOC entry 5054 (class 0 OID 17317)
-- Dependencies: 230
-- Data for Name: paquetes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paquetes (id, nombre, descripcion, precio_paquete, activo) FROM stdin;
3	Paquete 1		499.00	t
\.


--
-- TOC entry 5058 (class 0 OID 17376)
-- Dependencies: 234
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, folio, cliente_nombre, cliente_telefono, tipo_entrega, estado, tiempo_estimado_min, total, fecha_creacion, fecha_programada, motivo_cancelacion, inicio_preparacion, tiempo_real_min, tiempo_excedido_min, alerta_retraso, fecha_entrega) FROM stdin;
23	PED-1774947826	Cliente Mostrador	\N	LOCAL	ENTREGADO	15	499.00	2026-03-31 03:03:46.742849	\N	\N	\N	\N	\N	NORMAL	\N
24	PED-1774947966	Cliente Mostrador	\N	LOCAL	ENTREGADO	15	249.00	2026-03-31 03:06:07.044269	\N	\N	\N	\N	\N	NORMAL	\N
28	PED-1774949562	Cliente Mostrador	\N	LOCAL	CANCELADO	30	249.00	2026-03-31 03:32:42.646731	\N	\N	\N	\N	\N	NORMAL	\N
27	PED-1774949402	Cliente Mostrador	\N	LOCAL	CANCELADO	30	294.00	2026-03-31 03:30:02.04961	\N	Error en la preparación del pedido	\N	\N	\N	NORMAL	\N
26	PED-1774949179	Cliente Mostrador	\N	LOCAL	ENTREGADO	15	45.00	2026-03-31 03:26:19.998693	\N	\N	\N	\N	\N	NORMAL	\N
29	PED-1774995092	Cliente Mostrador	\N	LOCAL	ENTREGADO	30	249.00	2026-03-31 16:11:32.356866	\N	\N	\N	\N	\N	NORMAL	\N
25	PED-1774947972	Cliente Mostrador	\N	LOCAL	CANCELADO	15	249.00	2026-03-31 03:06:12.527575	\N	\N	\N	\N	\N	NORMAL	\N
30	PED-1774995688	Cliente Mostrador	\N	LOCAL	ENTREGADO	5	249.00	2026-03-31 16:21:28.748495	\N	\N	2026-03-31 16:21:34.325914-06	7.04	2.04	NORMAL	\N
31	PED-1774996959	Cliente Mostrador	\N	LOCAL	CANCELADO	10	249.00	2026-03-31 16:42:39.955861	\N	\N	2026-03-31 16:57:44.866894-06	0.89	0.00	NORMAL	\N
32	PED-1774998152	Cliente Mostrador	\N	LOCAL	ENTREGADO	5	498.00	2026-03-31 17:02:32.562766	\N	\N	2026-03-31 17:03:38.025851-06	4.04	0.00	EXCEDIDO	\N
\.


--
-- TOC entry 5050 (class 0 OID 17278)
-- Dependencies: 226
-- Data for Name: presentaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.presentaciones (id, producto_id, precio, tamano_id) FROM stdin;
5	5	249.00	9
7	7	249.00	9
8	8	249.00	9
10	10	45.00	10
\.


--
-- TOC entry 5048 (class 0 OID 17260)
-- Dependencies: 224
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, categoria_id, nombre, descripcion, activo, es_mitad_mitad) FROM stdin;
5	3	Pizza Hawaiana	\N	t	f
7	3	Pizza Pepperoni	\N	t	f
8	3	Pizza mitad y mitad	\N	t	t
10	4	Coca Cola	\N	t	f
\.


--
-- TOC entry 5052 (class 0 OID 17294)
-- Dependencies: 228
-- Data for Name: recetas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recetas (id, presentacion_id, ingrediente_id, cantidad_requerida) FROM stdin;
19	5	17	1.00
20	5	8	150.00
21	5	9	150.00
22	5	19	70.00
23	5	20	80.00
24	5	13	70.00
25	5	15	1.00
31	7	19	70.00
32	7	17	1.00
33	7	15	1.00
34	7	9	150.00
35	7	8	150.00
36	7	14	80.00
\.


--
-- TOC entry 5062 (class 0 OID 17441)
-- Dependencies: 238
-- Data for Name: seguimiento_estados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seguimiento_estados (id, pedido_id, estado_registrado, fecha_hora) FROM stdin;
\.


--
-- TOC entry 5064 (class 0 OID 24667)
-- Dependencies: 240
-- Data for Name: tamanos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tamanos (id, nombre) FROM stdin;
1	Personal
2	Mediana
3	Grande
9	Familiar
10	2 litros
\.


--
-- TOC entry 5082 (class 0 OID 0)
-- Dependencies: 221
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 4, true);


--
-- TOC entry 5083 (class 0 OID 0)
-- Dependencies: 231
-- Name: contenido_paquete_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contenido_paquete_id_seq', 5, true);


--
-- TOC entry 5084 (class 0 OID 0)
-- Dependencies: 235
-- Name: detalle_pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_pedido_id_seq', 15, true);


--
-- TOC entry 5085 (class 0 OID 0)
-- Dependencies: 219
-- Name: ingredientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredientes_id_seq', 20, true);


--
-- TOC entry 5086 (class 0 OID 0)
-- Dependencies: 229
-- Name: paquetes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paquetes_id_seq', 3, true);


--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 233
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 32, true);


--
-- TOC entry 5088 (class 0 OID 0)
-- Dependencies: 225
-- Name: presentaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.presentaciones_id_seq', 10, true);


--
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 223
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 10, true);


--
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 227
-- Name: recetas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recetas_id_seq', 36, true);


--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 237
-- Name: seguimiento_estados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seguimiento_estados_id_seq', 1, false);


--
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 239
-- Name: tamanos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tamanos_id_seq', 10, true);


--
-- TOC entry 4846 (class 2606 OID 17258)
-- Name: categorias categorias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);


--
-- TOC entry 4848 (class 2606 OID 17256)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 17340)
-- Name: contenido_paquete contenido_paquete_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contenido_paquete
    ADD CONSTRAINT contenido_paquete_pkey PRIMARY KEY (id);


--
-- TOC entry 4869 (class 2606 OID 17409)
-- Name: detalle_pedido detalle_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pkey PRIMARY KEY (id);


--
-- TOC entry 4844 (class 2606 OID 17245)
-- Name: ingredientes ingredientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes
    ADD CONSTRAINT ingredientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 17328)
-- Name: paquetes paquetes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paquetes
    ADD CONSTRAINT paquetes_pkey PRIMARY KEY (id);


--
-- TOC entry 4865 (class 2606 OID 17392)
-- Name: pedidos pedidos_folio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_folio_key UNIQUE (folio);


--
-- TOC entry 4867 (class 2606 OID 17390)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4852 (class 2606 OID 17287)
-- Name: presentaciones presentaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentaciones
    ADD CONSTRAINT presentaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 17271)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 17303)
-- Name: recetas recetas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas
    ADD CONSTRAINT recetas_pkey PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 17305)
-- Name: recetas recetas_presentacion_id_ingrediente_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas
    ADD CONSTRAINT recetas_presentacion_id_ingrediente_id_key UNIQUE (presentacion_id, ingrediente_id);


--
-- TOC entry 4874 (class 2606 OID 17450)
-- Name: seguimiento_estados seguimiento_estados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_estados
    ADD CONSTRAINT seguimiento_estados_pkey PRIMARY KEY (id);


--
-- TOC entry 4876 (class 2606 OID 24676)
-- Name: tamanos tamanos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tamanos
    ADD CONSTRAINT tamanos_nombre_key UNIQUE (nombre);


--
-- TOC entry 4878 (class 2606 OID 24674)
-- Name: tamanos tamanos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tamanos
    ADD CONSTRAINT tamanos_pkey PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 24684)
-- Name: presentaciones uq_prod_tamano; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentaciones
    ADD CONSTRAINT uq_prod_tamano UNIQUE (producto_id, tamano_id);


--
-- TOC entry 4870 (class 1259 OID 17458)
-- Name: idx_detalle_pedido_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalle_pedido_parent ON public.detalle_pedido USING btree (parent_detalle_id);


--
-- TOC entry 4842 (class 1259 OID 17457)
-- Name: idx_ingredientes_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ingredientes_stock ON public.ingredientes USING btree (stock_actual);


--
-- TOC entry 4863 (class 1259 OID 17456)
-- Name: idx_pedidos_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedidos_estado ON public.pedidos USING btree (estado);


--
-- TOC entry 4871 (class 1259 OID 24712)
-- Name: idx_seguimiento_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seguimiento_fecha ON public.seguimiento_estados USING btree (fecha_hora);


--
-- TOC entry 4872 (class 1259 OID 24711)
-- Name: idx_seguimiento_pedido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seguimiento_pedido ON public.seguimiento_estados USING btree (pedido_id);


--
-- TOC entry 4885 (class 2606 OID 24696)
-- Name: contenido_paquete contenido_paquete_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contenido_paquete
    ADD CONSTRAINT contenido_paquete_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id);


--
-- TOC entry 4886 (class 2606 OID 17341)
-- Name: contenido_paquete contenido_paquete_paquete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contenido_paquete
    ADD CONSTRAINT contenido_paquete_paquete_id_fkey FOREIGN KEY (paquete_id) REFERENCES public.paquetes(id) ON DELETE CASCADE;


--
-- TOC entry 4887 (class 2606 OID 17346)
-- Name: contenido_paquete contenido_paquete_presentacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contenido_paquete
    ADD CONSTRAINT contenido_paquete_presentacion_id_fkey FOREIGN KEY (presentacion_id) REFERENCES public.presentaciones(id) ON DELETE RESTRICT;


--
-- TOC entry 4888 (class 2606 OID 24701)
-- Name: contenido_paquete contenido_paquete_tamano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contenido_paquete
    ADD CONSTRAINT contenido_paquete_tamano_id_fkey FOREIGN KEY (tamano_id) REFERENCES public.tamanos(id);


--
-- TOC entry 4889 (class 2606 OID 17415)
-- Name: detalle_pedido detalle_pedido_paquete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_paquete_id_fkey FOREIGN KEY (paquete_id) REFERENCES public.paquetes(id) ON DELETE RESTRICT;


--
-- TOC entry 4890 (class 2606 OID 17425)
-- Name: detalle_pedido detalle_pedido_parent_detalle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_parent_detalle_id_fkey FOREIGN KEY (parent_detalle_id) REFERENCES public.detalle_pedido(id) ON DELETE CASCADE;


--
-- TOC entry 4891 (class 2606 OID 17410)
-- Name: detalle_pedido detalle_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 4892 (class 2606 OID 17420)
-- Name: detalle_pedido detalle_pedido_presentacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_presentacion_id_fkey FOREIGN KEY (presentacion_id) REFERENCES public.presentaciones(id) ON DELETE RESTRICT;


--
-- TOC entry 4893 (class 2606 OID 17430)
-- Name: detalle_pedido detalle_pedido_sabor_a_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_sabor_a_id_fkey FOREIGN KEY (sabor_a_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- TOC entry 4894 (class 2606 OID 17435)
-- Name: detalle_pedido detalle_pedido_sabor_b_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_sabor_b_id_fkey FOREIGN KEY (sabor_b_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- TOC entry 4880 (class 2606 OID 24690)
-- Name: presentaciones fk_presentaciones_tamano; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentaciones
    ADD CONSTRAINT fk_presentaciones_tamano FOREIGN KEY (tamano_id) REFERENCES public.tamanos(id) ON DELETE RESTRICT;


--
-- TOC entry 4881 (class 2606 OID 24678)
-- Name: presentaciones fk_tamano; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentaciones
    ADD CONSTRAINT fk_tamano FOREIGN KEY (tamano_id) REFERENCES public.tamanos(id) ON DELETE RESTRICT;


--
-- TOC entry 4882 (class 2606 OID 17288)
-- Name: presentaciones presentaciones_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presentaciones
    ADD CONSTRAINT presentaciones_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 4879 (class 2606 OID 17272)
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE RESTRICT;


--
-- TOC entry 4883 (class 2606 OID 17311)
-- Name: recetas recetas_ingrediente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas
    ADD CONSTRAINT recetas_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id) ON DELETE RESTRICT;


--
-- TOC entry 4884 (class 2606 OID 17306)
-- Name: recetas recetas_presentacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recetas
    ADD CONSTRAINT recetas_presentacion_id_fkey FOREIGN KEY (presentacion_id) REFERENCES public.presentaciones(id) ON DELETE CASCADE;


--
-- TOC entry 4895 (class 2606 OID 17451)
-- Name: seguimiento_estados seguimiento_estados_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_estados
    ADD CONSTRAINT seguimiento_estados_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


-- Completed on 2026-04-01 22:11:20

--
-- PostgreSQL database dump complete
--

\unrestrict 7AEIYVrgat0lQqjbBANNZLhjp7cEshqJD7ZRdZns3o4BBxEZy1KoppbdG3vwnDR

