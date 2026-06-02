import { BookText, CodeSquare, HomeIcon, UserRound, Linkedin, Twitter, Rss, Instagram, Youtube, Crop, Pencil, Computer, Book, Rocket, Speech, Users } from "lucide-react";

export const socialNetworks = [

    {
        id: 1,
        logo: <Linkedin size={30} strokeWidth={1} />,
        src: "#!",
    },
    {
        id: 2,
        logo: <Twitter size={30} strokeWidth={1} />,
        src: "#!",
    },
    {
        id: 3,
        logo: <Instagram size={30} strokeWidth={1} />,
        src: "#!",
    },
];


export const itemsNavbar = [
    {
        id: 1,
        title: "Home",
        icon: <HomeIcon size={25} color="#fff" strokeWidth={1} />,
        link: "/",
    },
    {
        id: 2,
        title: "Skaters",
        icon: <Users size={25} color="#fff" strokeWidth={1} />,
        link: "/explore",
    },
    {
        id: 3,
        title: "User",
        icon: <UserRound size={25} color="#fff" strokeWidth={1} />,
        link: "/about",
    },
    {
        id: 4,
        title: "Book",
        icon: <BookText size={25} color="#fff" strokeWidth={1} />,
        link: "/services",
    },
    {
        id: 5,
        title: "Target",
        icon: <CodeSquare size={25} color="#fff" strokeWidth={1} />,
        link: "/portfolio",
    },
    {
        id: 6,
        title: "Home",
        icon: <Speech size={25} color="#fff" strokeWidth={1} />,
        link: "/testimonials",
    },
];

export const dataAboutPage = [
    {
        id: 1,
        title: "Frontend Developer",
        subtitle: "TechSolutions",
        description: "Colabora con un equipo dinámico para desarrollar interfaces de usuario atractivas y funcionales que impulsen el éxito de nuestros clientes en el mundo digital.",
        date: "Nov 2023 ",
    },
    {
        id: 2,
        title: "Creador de Experiencias Digitales",
        subtitle: "PixelCrafters",
        description: "Trabaja en proyectos emocionantes que desafían los límites de la creatividad y la tecnología. Únete a nosotros mientras creamos experiencias digitales cautivadoras que inspiran y cautivan a nuestros usuarios.",
        date: "May 2021",
    },
    {
        id: 3,
        title: "Especialista en Desarrollo Frontend",
        subtitle: "CodeForge Solutions",
        description: "Como desarrollador frontend, tendrás la oportunidad de colaborar en proyectos diversos y desafiantes que te permitirán expandir tus habilidades y dejar tu huella en el mundo digital.",
        date: "Ago 2019",
    },
    {
        id: 4,
        title: "Prácticas Grado",
        subtitle: "WebWizards Inc.",
        description: "Únete a nosotros mientras creamos sitios web y aplicaciones interactivas que sorprenden y deleitan a nuestros clientes. Si tienes pasión por el diseño y la programación, y disfrutas colaborar en un entorno creativo, ¡queremos conocerte!        ",
        date: "Mar 2018",
    },
]

export const dataCounter = [
    {
        id: 0,
        endCounter: 10,
        text: "Años de experiencia",
        lineRight: true,
        lineRightMobile: true,
    },
    {
        id: 1,
        endCounter: 80,
        text: "Clientes satisfechos",
        lineRight: true,
        lineRightMobile: false,
    },
    {
        id: 2,
        endCounter: 220,
        text: "Proyectos finalizados",
        lineRight: true,
        lineRightMobile: true,
    },
    {
        id: 3,
        endCounter: 30,
        text: "Premios ganadores",
        lineRight: false,
        lineRightMobile: false,
    },
];

export const serviceData = [
    {
        icon: <Crop />,
        title: "Branding",
        description: "Desarrollo de una identidad de marca sólida y coherente, incluyendo diseño de logotipo, colores y elementos visuales",
    },
    {
        icon: <Pencil />,
        title: "Diseño web",
        description: "Diseño creativo y profesional de interfaces web intuitivas y atractivas, centradas en la experiencia del usuario",
    },
    {
        icon: <Computer />,
        title: "Desarrollo web",
        description: "Diseño y desarrollo de sitios web a medida, adaptados a tus necesidades",
    },
    {
        icon: <Book />,
        title: "Copywriting",
        description: "Creación de contenido persuasivo y atractivo que capta la atención de tu audiencia",
    },
    {
        icon: <Rocket />,
        title: "SEO",
        description: "Optimización de tu presencia en línea mediante estrategias de SEO avanzadas, ",
    },
];

export const dataPortfolio = [
    {
        id: 1,
        title: "Web Pro",
        image: "/image-1.jpg",
        urlGithub: "#!",
        urlDemo: "#!",
    },
    {
        id: 2,
        title: "Desarrollo Web Ágil",
        image: "/image-2.jpg",
        urlGithub: "#!",
        urlDemo: "#!",
    },
    {
        id: 3,
        title: "Estrategias Web",
        image: "/image-3.jpg",
        urlGithub: "#!",
        urlDemo: "#!",
    },
    {
        id: 4,
        title: "Ideas Creativas",
        image: "/image-4.jpg",
        urlGithub: "#!",
        urlDemo: "#!",
    },
    {
        id: 5,
        title: "Webs Impactantes",
        image: "/image-5.jpg",
        urlGithub: "#!",
        urlDemo: "#!",
    },
    {
        id: 6,
        title: "Web Dinámica",
        image: "/image-6.jpg",
        urlGithub: "#!",
        urlDemo: "#!",
    },
    {
        id: 7,
        title: "Dark Web ",
        image: "/image-7.jpg",
        urlGithub: "#!",
        urlDemo: "#!",
    },
    {
        id: 8,
        title: "E-commerce web",
        image: "/image-8.jpg",
        urlGithub: "#!",
        urlDemo: "#!",
    }
];

export const dataTestimonials = [
    {
        id: 1,
        name: "George Snow",
        description:
            "¡Increíble plataforma! Los testimonios aquí son genuinos y me han ayudado a tomar decisiones informadas. ¡Altamente recomendado!",
        imageUrl: "/profile1.png",
    },
    {
        id: 2,
        name: "Juan Pérez",
        description:
            "Me encanta la variedad de testimonios disponibles en esta página. Es inspirador ver cómo otras personas han superado desafíos similares a los míos. ¡Gracias por esta invaluable fuente de motivación!",
        imageUrl: "/profile2.png",
    },
    {
        id: 3,
        name: "María García",
        description:
            "Excelente recurso para obtener opiniones auténticas sobre diferentes productos y servicios. Me ha ayudado mucho en mis compras en línea. ¡Bravo por este sitio!",
        imageUrl: "/profile3.png",
    },
    {
        id: 4,
        name: "Laura Snow",
        description:
            "¡Qué descubrimiento tan fantástico! Los testimonios aquí son honestos y detallados. Me siento más seguro al tomar decisiones después de leer las experiencias compartidas por otros usuarios.",
        imageUrl: "/profile4.png",
    },
    {
        id: 5,
        name: "Carlos Sánchez",
        description:
            "Una joya en la web. Los testimonios son fáciles de encontrar y están bien organizados. ¡Definitivamente mi destino número uno cuando necesito referencias confiables!",
        imageUrl: "/profile5.png",
    },
    {
        id: 6,
        name: "Antonio Martínez",
        description:
            "¡Fantástico recurso para aquellos que buscan validación antes de tomar decisiones importantes! Los testimonios aquí son veraces y realmente útiles. ¡Gracias por simplificar mi proceso de toma de decisiones!",
        imageUrl: "/profile6.png",
    },
];

export const dataTeam = [
    {
        id: 1,
        name: "felipe",
        imgURl: "/dev-felipe.png",
        role: "Desarrollador Web",
        experience: "5 años de experiencia",
        education: "Licenciatura en Ciencias de la Computación",
        skills: ["Tailwind", "JavaScript", "React.js", "Node.js", "Nextjs"],
        socialNetworks: [
            {
                id: 1,
                logo: <Linkedin size={20} strokeWidth={1} />,
                src: "#!",
            },
            {
                id: 2,
                logo: <Twitter size={20} strokeWidth={1} />,
                src: "#!",
            },
            {
                id: 3,
                logo: <Instagram size={20} strokeWidth={1} />,
                src: "#!",
            },
        ],
        description: "Soy un desarrollador web apasionado por la tecnología y el desarrollo de aplicaciones web. Me encanta crear cosas y compartirlas con el mundo. ¡Si estás buscando un desarrollador web confiable, estoy aquí para ayudarte!",
    },
    {
        id: 2,
        name: "cristian",
        imgURl: "/dev-cristian.png",
        role: "Diseñador UX/UI",
        experience: "3 años de experiencia",
        education: "Diplomado en Diseño de Experiencia de Usuario",
        skills: ["Diseño de interfaz de usuario", "Prototipado", "Usabilidad", "Adobe XD", "Figma"],
        socialNetworks: [
            {
                id: 1,
                logo: <Linkedin size={20} strokeWidth={1} />,
                src: "#!",
            },
            /* {
                id: 2,
                logo: <Twitter size={20} strokeWidth={1} />,
                src: "#!",
            }, */
            {
                id: 3,
                logo: <Instagram size={20} strokeWidth={1} />,
                src: "#!",
            },
        ],
        description: "Soy un diseñador UX/UI apasionado por crear experiencias digitales atractivas y fáciles de usar. Me esfuerzo por diseñar interfaces que no solo sean hermosas, sino también funcionales y centradas en el usuario. ¡Espero poder ayudarte a llevar tu proyecto al siguiente nivel!",
    },
]


export const dataTrickets = [
    {
        id: 1,
        name: "cristian",
        imgURl: "/tricket-1.jpg",
        likes : 2,
        share:2,
        skills: ["U", "Steet"],
    },
    {
        id: 2,
        name: "cristian",
        imgURl: "/tricket-2.jpg",
        likes : 2,
        share:2,
        skills: ["U", "Steet"],
    },
    {
        id: 3,
        name: "cristian",
        imgURl: "/tricket-3.jpg",
        likes : 2,
        share:2,
        skills: ["U", "Steet"],
    },
    {
        id: 4,
        name: "cristian",
        imgURl: "/tricket-4.jpg",
        likes : 2,
        share:2,
        skills: ["U", "Steet"],
    }


]

export const highScore = [
    {
        id: 1,
        name: "cristian",
        imgURl: "/tricket-1.jpg",
        likes : 2,
        share:2,
        skills: ["U", "Steet"],
    },
    {
        id: 2,
        name: "cristian",
        imgURl: "/tricket-2.jpg",
        likes : 2,
        share:2,
        skills: ["U", "Steet"],
    },
    {
        id: 3,
        name: "cristian",
        imgURl: "/tricket-3.jpg",
        likes : 2,
        share:2,
        skills: ["U", "Steet"],
    }


]

export const howToWin = [
    {
      imagen: "/trick-est.webp",
      titulo: "patina",
      caption: "¡Prepárate para deslizarte y dominar las calles! Encuentra las mejores líneas, realiza trucos asombrosos y siente la libertad sobre tu tabla."
    },
    {
      imagen: "/graba.png",
      titulo: "graba",
      caption: "Captura tus mejores momentos sobre la tabla y comparte tu estilo único con el mundo. ¡Graba tus trucos más locos y muestra tu pasión por el skateboarding!"
    },
    {
      imagen: "/postea.png",
      titulo: "postea",
      caption: "Haz que tus amigos se sientan parte de la acción compartiendo tus sesiones de skate más épicas en línea. ¡Postea tus clips y fotos para inspirar a otros skaters y fortalecer la comunidad!"
    }
  ]
