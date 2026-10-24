
import {
    Layers,
    Hammer,
    Ruler,
    Waves,
    Building2,
    LineChart,
} from "lucide-react";

export const services = [
    {
        icon: Layers,
        title: "Estudios geotécnicos",
        desc: "Conoce las características del terreno antes de definir la cimentación. Información geotécnica para fundamentar las decisiones de proyecto y valorar las condiciones del subsuelo.",
    },
    {
        icon: Hammer,
        title: "Sondeos y perforación",
        desc: "Investigación del subsuelo mediante sondeos, ensayos SPT, toma de muestras y monitoreo piezométrico, según las necesidades de cada actuación.",
    },
    {
        icon: Ruler,
        title: "Ensayos in situ",
        desc: "Ensayos SPT, CPTu, DPL/DPM y de placa para obtener datos sobre las características y el comportamiento del terreno.",
    },
    {
        icon: Waves,
        title: "Geofísica aplicada",
        desc: "Métodos como MASW/ReMi y tomografía eléctrica para complementar la investigación geotécnica y mejorar la caracterización del subsuelo.",
    },
    {
        icon: Building2,
        title: "Mecánica de suelos",
        desc: "Análisis relacionados con la capacidad portante, los asentamientos y la estabilidad de taludes como apoyo a las decisiones técnicas del proyecto.",
    },
    {
        icon: LineChart,
        title: "Monitoreo y auscultación",
        desc: "Seguimiento mediante piezómetros, inclinómetros y control de deformaciones en las actuaciones que requieren este tipo de mediciones.",
    },
] as const;

export const projectAreas = [
    {
        title: "Estudios geotécnicos",
        desc: "Investigación y caracterización del terreno para conocer sus condiciones y aportar información relevante para el diseño de cimentaciones.",
    },
    {
        title: "Obra lineal",
        desc: "Investigación geotécnica y control de deformaciones en actuaciones relacionadas con carreteras, tuberías y corredores ferroviarios.",
    },
    {
        title: "Hidrogeología",
        desc: "Estudios hidrogeológicos y elaboración de mapas de isopiezas para contribuir al análisis de las condiciones y la distribución del agua subterránea.",
    },
    {
        title: "Estudios de avenidas",
        desc: "Análisis estadístico de crecidas y periodos de retorno como apoyo a estudios y diseños hidráulicos.",
    },
] as const;

export const methodologySteps = [
    {
        title: "Definimos el alcance",
        desc: "Conocemos la ubicación, el tipo de actuación y las necesidades técnicas del proyecto para valorar la investigación necesaria.",
    },
    {
        title: "Investigamos el terreno",
        desc: "Planteamos los sondeos y ensayos que correspondan al alcance acordado y a las características de la actuación.",
    },
    {
        title: "Analizamos los resultados",
        desc: "Interpretamos los datos obtenidos en campo y laboratorio, cuando corresponda, para caracterizar las condiciones del subsuelo.",
    },
    {
        title: "Entregamos conclusiones útiles",
        desc: "Recogemos los resultados de la investigación en el informe correspondiente, con información y recomendaciones técnicas según el alcance del estudio.",
    },
] as const;

export const faqs = [
    {
        question: "¿En qué momento conviene solicitar un estudio geotécnico?",
        answer:
            "Lo recomendable es plantearlo durante las fases iniciales del proyecto, antes de cerrar las decisiones de cimentación. Si ya dispones de documentación técnica o de una planificación de obra, podemos revisarla para valorar el alcance de la investigación.",
    },
    {
        question: "¿Qué información necesitáis para preparar una propuesta?",
        answer:
            "Para empezar, nos ayuda conocer la ubicación, el tipo de proyecto, la fase en la que se encuentra y la información técnica disponible. Con esos datos podemos valorar el alcance de los trabajos que conviene estudiar.",
    },
    {
        question: "¿Podéis colaborar con estudios de arquitectura e ingenierías?",
        answer:
            "Sí. Podemos hablar de las necesidades de tu equipo y valorar una colaboración para proyectos concretos o una dinámica de trabajo recurrente, según el tipo de actuaciones que desarrolléis.",
    },
    {
        question: "¿En qué zonas trabajáis?",
        answer:
            "Nuestra actividad se centra en Segovia y provincias cercanas. Indícanos dónde se encuentra el proyecto para que podamos valorar si podemos atender la actuación.",
    },
    {
        question: "¿Cuánto se tarda en recibir una respuesta?",
        answer:
            "El plazo de respuesta indicado es de 24 horas. El tiempo necesario para planificar y realizar los trabajos y preparar el informe dependerá del alcance y de las condiciones de cada proyecto.",
    },
] as const;

export const trustMetrics = [
    { value: "25+ años de experiencia", label: "Trayectoria en el ámbito de la geotecnia." },
    { value: "500+ sondeos realizados", label: "Experiencia en trabajos de investigación del terreno." },
    { value: "Respuesta en 24 h*", label: "Un plazo de respuesta indicado para atender tu consulta inicial." },
] as const;

export const contactDetails = {
    email: "geotecniayservicios@gmail.com",
} as const;
