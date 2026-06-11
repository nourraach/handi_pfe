"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { triggerAccessibilityPanel } from "@/components/accessibility-widget";
import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";
import "./home.css";

type LandingIconName = "match" | "workspace" | "support" | "access";
type StatTone = "lavender" | "violet" | "pink";

type LandingContent = {
  topbarPill: string;
  brandAriaLabel: string;
  navItems: Array<{ label: string; href: string }>;
  actions: {
    settings: string;
    accessibility: string;
    accessibilityHint: string;
    login: string;
    createAccount: string;
    employer: string;
    talkToTeam: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    notes: string[];
    imageAlt: string;
    matchEyebrow: string;
    matchRole: string;
    matchCompany: string;
    matchScore: string;
    progressEyebrow: string;
    progressTitle: string;
    progressPercent: string;
    stats: Array<{ value: string; label: string; tone: StatTone }>;
  };
  platform: {
    kicker: string;
    title: string;
    description: string;
  };
  features: Array<{
    icon: LandingIconName;
    label: string;
    title: string;
    text: string;
  }>;
  journey: {
    kicker: string;
    title: string;
    description: string;
  };
  steps: Array<{
    step: string;
    title: string;
    text: string;
    previewLabel: string;
    previewValue: string;
  }>;
  impactAriaLabel: string;
  impactStats: Array<{ value: string; label: string }>;
  community: {
    kicker: string;
    title: string;
  };
  testimonials: Array<{
    initials: string;
    badge: string;
    name: string;
    role: string;
    quote: string;
  }>;
  cta: {
    title: string;
    description: string;
  };
  footer: {
    description: string;
    platformTitle: string;
    features: string;
    journey: string;
    stories: string;
    teamsTitle: string;
    employers: string;
    candidates: string;
    partnerships: string;
    contactTitle: string;
    location: string;
  };
};

const heroImageSrc = "/uploads/hero-reference-inclusive-hiring.png";

const progressAvatars = [
  "ht-avatar-photo-1",
  "ht-avatar-photo-2",
  "ht-avatar-photo-3",
  "ht-avatar-photo-4",
] as const;

const landingContent: Record<Locale, LandingContent> = {
  fr: {
    topbarPill: "Recrutement inclusif",
    brandAriaLabel: "Accueil HandiTalents",
    navItems: [
      { label: "Accueil", href: "#hero" },
      { label: "Plateforme", href: "#platform" },
      { label: "Parcours", href: "#journey" },
      { label: "Communauté", href: "#community" },
    ],
    actions: {
      settings: "Réglages",
      accessibility: "Accessibilité",
      accessibilityHint: "Paramètres d’accessibilité",
      login: "Connexion",
      createAccount: "Créer un compte",
      employer: "Je suis un employeur",
      talkToTeam: "Parler à notre équipe",
    },
    hero: {
      eyebrow: "La première plateforme tunisienne de recrutement inclusif",
      title: "Trouvez l'emploi que vous méritez, dans un endroit",
      highlight: "qui vous valorise",
      description:
        "HandiTalents connecte les talents en situation de handicap avec des employeurs inclusifs, parce que chacun mérite un travail digne, stable et porteur de sens.",
      notes: ["En partenariat avec l'ANETI", "Conforme à la loi n°41 de 2010"],
      imageAlt: "Réunion inclusive en entreprise avec une personne en fauteuil roulant",
      matchEyebrow: "Meilleure opportunité pour vous",
      matchRole: "UI/UX Designer",
      matchCompany: "TechWave",
      matchScore: "Compatibilité 94 %",
      progressEyebrow: "Avancement du recrutement",
      progressTitle: "Entretien programmé",
      progressPercent: "75 %",
      stats: [
        { value: "250+", label: "Employeurs inclusifs", tone: "lavender" },
        { value: "1000+", label: "Offres disponibles", tone: "violet" },
        { value: "2000+", label: "Talents accompagnés", tone: "pink" },
      ],
    },
    platform: {
      kicker: "Pensé pour les candidats, les employeurs et les équipes d'accompagnement",
      title: "Tout ce qu'il faut dans une seule plateforme inclusive",
      description:
        "Retrouvez l'élégance d'un produit SaaS premium tout en gardant l'essentiel au centre : de meilleurs emplois, des parcours plus accessibles et un recrutement plus respectueux.",
    },
    features: [
      {
        icon: "match",
        label: "Matching candidat",
        title: "Découverte d'opportunités inclusive",
        text: "Faites remonter les offres adaptées aux compétences, aux ambitions et aux préférences d'accessibilité au lieu d'imposer des filtres génériques.",
      },
      {
        icon: "workspace",
        label: "Espace employeur",
        title: "Workflows de recrutement premium",
        text: "Présélectionnez les talents, préparez les entretiens et organisez les aménagements dans un espace plus calme pour les équipes RH inclusives.",
      },
      {
        icon: "support",
        label: "Accompagnement guidé",
        title: "Un soutien humain à chaque étape",
        text: "Associez l'intelligence de la plateforme à un vrai accompagnement pour le profil, la préparation aux entretiens et l'intégration après l'offre.",
      },
      {
        icon: "access",
        label: "Accessibilité d'abord",
        title: "Conçu pour le confort et la clarté",
        text: "Des interfaces lisibles, une navigation clavier fluide et une communication plus transparente rendent chaque interaction plus simple dès le départ.",
      },
    ],
    journey: {
      kicker: "Simple, clair et rassurant",
      title: "Comment HandiTalents fonctionne",
      description: "Chaque étape est pensée pour réduire la friction, clarifier la suite et garder l’accessibilité visible tout au long du parcours.",
    },
    steps: [
      {
        step: "01",
        title: "Créez votre profil",
        text: "Présentez votre expérience, vos forces et vos objectifs dans un profil pensé pour la confiance, pas pour la complexité.",
        previewLabel: "Score du profil",
        previewValue: "92 % complété",
      },
      {
        step: "02",
        title: "Précisez votre cadre idéal",
        text: "Indiquez les besoins d'accessibilité, le rythme de travail et les conditions qui vous permettent de réussir.",
        previewLabel: "Préférences synchronisées",
        previewValue: "4 préférences",
      },
      {
        step: "03",
        title: "Rencontrez des employeurs mieux adaptés",
        text: "Recevez des rapprochements plus pertinents, suivez chaque étape et concentrez-vous sur les offres déjà ouvertes à l'inclusion.",
        previewLabel: "Nouveaux matchs",
        previewValue: "12 cette semaine",
      },
      {
        step: "04",
        title: "Avancez avec un vrai support",
        text: "Préparez les entretiens, l'intégration et les relances avec plus de visibilité et d'accompagnement.",
        previewLabel: "Prochaine étape",
        previewValue: "Entretien réservé",
      },
    ],
    impactAriaLabel: "Indicateurs d'impact",
    impactStats: [
      { value: "20,000+", label: "talents inscrits" },
      { value: "250+", label: "employeurs inclusifs" },
      { value: "1000+", label: "offres actives publiées" },
      { value: "99%", label: "satisfaction support" },
    ],
    community: {
      kicker: "Adopté par celles et ceux qui recrutent et accompagnent",
      title: "Ce que dit notre communauté",
    },
    testimonials: [
      {
        initials: "AR",
        badge: "Candidate",
        name: "Amal R.",
        role: "Product Designer",
        quote:
          "HandiTalents a rendu tout le parcours plus respectueux dès le premier clic. J'ai pu expliquer mes besoins, suivre chaque étape et arriver à l'entretien avec beaucoup moins de stress.",
      },
      {
        initials: "YK",
        badge: "Employeur",
        name: "Youssef K.",
        role: "Talent Acquisition Lead",
        quote:
          "Notre équipe a enfin un espace qui traite le recrutement inclusif comme un vrai workflow métier, pas comme une couche ajoutée au dernier moment.",
      },
      {
        initials: "FB",
        badge: "Partenaire support",
        name: "Fatima B.",
        role: "Career Coach",
        quote:
          "La plateforme donne plus de clarté aux candidats et de meilleurs signaux aux équipes d'accompagnement. On passe plus de temps à aider, moins à courir après les informations.",
      },
    ],
    cta: {
      title: "Prêt à rendre le recrutement accessible plus premium, concret et mesurable ?",
      description:
        "Rejoignez HandiTalents pour connecter les talents, les employeurs et les équipes d'accompagnement dans un parcours d'embauche plus réfléchi.",
    },
    footer: {
      description:
        "HandiTalents est une plateforme de recrutement inclusive qui aide les personnes en situation de handicap, les employeurs et les équipes d'accompagnement à construire de meilleurs parcours professionnels.",
      platformTitle: "Plateforme",
      features: "Fonctionnalités",
      journey: "Parcours",
      stories: "Témoignages",
      teamsTitle: "Pour les équipes",
      employers: "Employeurs",
      candidates: "Candidats",
      partnerships: "Partenariats",
      contactTitle: "Contact",
      location: "Tunis, Tunisie",
    },
  },
  en: {
    topbarPill: "Inclusive hiring",
    brandAriaLabel: "HandiTalents home",
    navItems: [
      { label: "Home", href: "#hero" },
      { label: "Platform", href: "#platform" },
      { label: "Journey", href: "#journey" },
      { label: "Community", href: "#community" },
    ],
    actions: {
      settings: "Settings",
      accessibility: "Accessibility",
      accessibilityHint: "Accessibility settings",
      login: "Log in",
      createAccount: "Create account",
      employer: "I'm an employer",
      talkToTeam: "Talk to our team",
    },
    hero: {
      eyebrow: "Tunisia's first inclusive hiring platform",
      title: "Find the job you deserve, in a place",
      highlight: "that values you",
      description:
        "HandiTalents connects talented people with disabilities to inclusive employers because everyone deserves meaningful, dignified work.",
      notes: ["In partnership with ANETI", "Law No. 41 of 2010 compliant"],
      imageAlt: "Inclusive team meeting with a wheelchair user in a modern workplace",
      matchEyebrow: "Top match for you",
      matchRole: "UI/UX Designer",
      matchCompany: "TechWave",
      matchScore: "94% match",
      progressEyebrow: "Hiring progress",
      progressTitle: "Interview scheduled",
      progressPercent: "75%",
      stats: [
        { value: "250+", label: "Inclusive employers", tone: "lavender" },
        { value: "1000+", label: "Jobs available", tone: "violet" },
        { value: "2000+", label: "Talents empowered", tone: "pink" },
      ],
    },
    platform: {
      kicker: "Built for candidates, employers, and support teams",
      title: "Everything you need in one inclusive platform",
      description:
        "Recreate the ease of a premium SaaS experience while keeping the mission clear: better jobs, more accessible hiring, and stronger outcomes for people with disabilities.",
    },
    features: [
      {
        icon: "match",
        label: "Candidate matching",
        title: "Inclusive job discovery",
        text: "Surface roles that fit skills, ambitions, and accessibility preferences instead of forcing candidates into generic filters.",
      },
      {
        icon: "workspace",
        label: "Employer workspace",
        title: "Premium recruiting workflows",
        text: "Shortlist talent, prepare interviews, and organize accommodations in a calmer workspace designed for inclusive hiring teams.",
      },
      {
        icon: "support",
        label: "Guided support",
        title: "Human coaching at every step",
        text: "Blend platform intelligence with real support for profile building, interview preparation, and post-offer onboarding confidence.",
      },
      {
        icon: "access",
        label: "Accessibility first",
        title: "Designed for clarity and comfort",
        text: "Readable layouts, keyboard-friendly flows, and transparent communication make every interaction more usable from day one.",
      },
    ],
    journey: {
      kicker: "Simple, clear, and supportive",
      title: "How HandiTalents works",
      description: "Each step is designed to reduce friction, clarify next actions, and keep accessibility visible.",
    },
    steps: [
      {
        step: "01",
        title: "Create your profile",
        text: "Present your experience, strengths, and goals in a profile built around confidence rather than complexity.",
        previewLabel: "Profile score",
        previewValue: "92% complete",
      },
      {
        step: "02",
        title: "Share your ideal setup",
        text: "Clarify the accessibility, schedule, and workplace conditions that help you do your best work.",
        previewLabel: "Needs synced",
        previewValue: "4 preferences",
      },
      {
        step: "03",
        title: "Meet better-fit employers",
        text: "Receive thoughtful matches, track every stage, and focus on openings that already respect inclusive practices.",
        previewLabel: "Fresh matches",
        previewValue: "12 this week",
      },
      {
        step: "04",
        title: "Move forward with support",
        text: "Prepare interviews, onboarding, and follow-up with the guidance and visibility needed to keep momentum.",
        previewLabel: "Next milestone",
        previewValue: "Interview booked",
      },
    ],
    impactAriaLabel: "Impact highlights",
    impactStats: [
      { value: "20,000+", label: "talents registered" },
      { value: "250+", label: "inclusive employers" },
      { value: "1000+", label: "active roles posted" },
      { value: "99%", label: "support satisfaction" },
    ],
    community: {
      kicker: "Trusted by the people doing the work",
      title: "What our community says",
    },
    testimonials: [
      {
        initials: "AR",
        badge: "Candidate",
        name: "Amal R.",
        role: "Product Designer",
        quote:
          "HandiTalents made the process feel respectful from the first click. I could explain what I needed, follow every step, and interview with far less stress.",
      },
      {
        initials: "YK",
        badge: "Employer",
        name: "Youssef K.",
        role: "Talent Acquisition Lead",
        quote:
          "Our team finally has a workspace that treats inclusive hiring like a core business workflow, not an afterthought stitched onto recruiting.",
      },
      {
        initials: "FB",
        badge: "Support partner",
        name: "Fatima B.",
        role: "Career Coach",
        quote:
          "The platform gives candidates more clarity and gives support teams better signals, which means we spend more time helping and less time chasing context.",
      },
    ],
    cta: {
      title: "Ready to make accessible hiring feel premium, practical, and measurable?",
      description:
        "Join HandiTalents to connect talent, employers, and support teams through a more thoughtful hiring journey.",
    },
    footer: {
      description:
        "HandiTalents is an inclusive hiring platform helping people with disabilities, employers, and support teams build better career outcomes together.",
      platformTitle: "Platform",
      features: "Features",
      journey: "Journey",
      stories: "Stories",
      teamsTitle: "For teams",
      employers: "Employers",
      candidates: "Candidates",
      partnerships: "Partnerships",
      contactTitle: "Contact",
      location: "Tunis, Tunisia",
    },
  },
  ar: {
    topbarPill: "توظيف شامل",
    brandAriaLabel: "الصفحة الرئيسية لهاندي تالنتس",
    navItems: [
      { label: "الرئيسية", href: "#hero" },
      { label: "المنصة", href: "#platform" },
      { label: "المسار", href: "#journey" },
      { label: "المجتمع", href: "#community" },
    ],
    actions: {
      settings: "الإعدادات",
      accessibility: "إمكانية الوصول",
      accessibilityHint: "إعدادات إمكانية الوصول",
      login: "تسجيل الدخول",
      createAccount: "إنشاء حساب",
      employer: "أنا صاحب عمل",
      talkToTeam: "تحدث مع فريقنا",
    },
    hero: {
      eyebrow: "أول منصة تونسية للتوظيف الشامل",
      title: "ابحث عن الوظيفة التي تستحقها، في مكان",
      highlight: "يقدّرك",
      description:
        "تربط HandiTalents بين المواهب من الأشخاص ذوي الإعاقة وبين أصحاب العمل الشاملين، لأن الجميع يستحق عملاً كريماً وذا معنى.",
      notes: ["بالشراكة مع ANETI", "متوافق مع القانون عدد 41 لسنة 2010"],
      imageAlt: "اجتماع عمل شامل يضم مستخدمة كرسي متحرك ضمن فريق حديث",
      matchEyebrow: "أفضل فرصة لك",
      matchRole: "مصمم UI/UX",
      matchCompany: "TechWave",
      matchScore: "توافق 94%",
      progressEyebrow: "تقدم التوظيف",
      progressTitle: "تمت برمجة المقابلة",
      progressPercent: "75%",
      stats: [
        { value: "250+", label: "أصحاب عمل شاملون", tone: "lavender" },
        { value: "1000+", label: "وظائف متاحة", tone: "violet" },
        { value: "2000+", label: "مواهب تم دعمها", tone: "pink" },
      ],
    },
    platform: {
      kicker: "مصمم للمرشحين وأصحاب العمل وفرق الدعم",
      title: "كل ما تحتاجه في منصة شاملة واحدة",
      description:
        "احصل على تجربة SaaS أنيقة مع بقاء الرسالة واضحة: فرص أفضل، توظيف أكثر إتاحة، ونتائج أقوى للأشخاص ذوي الإعاقة.",
    },
    features: [
      {
        icon: "match",
        label: "مطابقة المرشحين",
        title: "اكتشاف وظائف بشكل شامل",
        text: "اعرض الوظائف المناسبة للمهارات والطموحات واحتياجات الإتاحة بدلاً من فرض فلاتر عامة على الجميع.",
      },
      {
        icon: "workspace",
        label: "مساحة أصحاب العمل",
        title: "سير توظيف احترافي",
        text: "قم بفرز المواهب والتحضير للمقابلات وتنظيم الترتيبات التيسيرية في مساحة أهدأ لفرق التوظيف الشامل.",
      },
      {
        icon: "support",
        label: "دعم موجّه",
        title: "مرافقة بشرية في كل خطوة",
        text: "اجمع بين ذكاء المنصة والدعم الفعلي لبناء الملف الشخصي والتحضير للمقابلات والاندماج بعد العرض.",
      },
      {
        icon: "access",
        label: "الإتاحة أولاً",
        title: "مصمم للوضوح والراحة",
        text: "واجهات واضحة، تدفق مريح عبر لوحة المفاتيح، وتواصل أكثر شفافية يجعل كل تفاعل أسهل منذ البداية.",
      },
    ],
    journey: {
      kicker: "بسيط وواضح ومطمئن",
      title: "كيف تعمل HandiTalents",
      description: "كل خطوة صممت لتقليل الاحتكاك وتوضيح التالي والحفاظ على الإتاحة ظاهرة طوال المسار.",
    },
    steps: [
      {
        step: "01",
        title: "أنشئ ملفك الشخصي",
        text: "اعرض خبراتك ونقاط قوتك وأهدافك في ملف مبني على الثقة لا على التعقيد.",
        previewLabel: "درجة الملف",
        previewValue: "مكتمل بنسبة 92%",
      },
      {
        step: "02",
        title: "شارك بيئة العمل المناسبة لك",
        text: "حدد احتياجات الإتاحة وجدولك وظروف العمل التي تساعدك على تقديم أفضل ما لديك.",
        previewLabel: "تمت مزامنة الاحتياجات",
        previewValue: "4 تفضيلات",
      },
      {
        step: "03",
        title: "التقِ بأصحاب عمل أكثر ملاءمة",
        text: "استقبل تطابقات أفضل وتابع كل مرحلة وركز على الفرص التي تحترم الممارسات الشاملة مسبقاً.",
        previewLabel: "تطابقات جديدة",
        previewValue: "12 هذا الأسبوع",
      },
      {
        step: "04",
        title: "تقدم مع دعم حقيقي",
        text: "استعد للمقابلات والاندماج والمتابعة بوضوح أكبر ودعم يساعدك على الحفاظ على الزخم.",
        previewLabel: "المرحلة التالية",
        previewValue: "تم حجز المقابلة",
      },
    ],
    impactAriaLabel: "مؤشرات الأثر",
    impactStats: [
      { value: "20,000+", label: "موهبة مسجلة" },
      { value: "250+", label: "صاحب عمل شامل" },
      { value: "1000+", label: "وظيفة نشطة منشورة" },
      { value: "99%", label: "رضا عن الدعم" },
    ],
    community: {
      kicker: "موثوق من الأشخاص الذين ينجزون العمل",
      title: "ماذا يقول مجتمعنا",
    },
    testimonials: [
      {
        initials: "AR",
        badge: "مرشحة",
        name: "Amal R.",
        role: "مصممة منتجات",
        quote:
          "جعلت HandiTalents التجربة أكثر احتراماً منذ أول نقرة. استطعت شرح احتياجاتي ومتابعة كل خطوة والوصول إلى المقابلة بقدر أقل بكثير من التوتر.",
      },
      {
        initials: "YK",
        badge: "صاحب عمل",
        name: "Youssef K.",
        role: "مسؤول استقطاب المواهب",
        quote:
          "أصبح لدى فريقنا أخيراً فضاء يعامل التوظيف الشامل كسير عمل أساسي، لا كطبقة إضافية ملحقة بمنظومة التوظيف.",
      },
      {
        initials: "FB",
        badge: "شريك دعم",
        name: "Fatima B.",
        role: "مستشارة مهنية",
        quote:
          "تعطي المنصة المرشحين وضوحاً أكبر وتمنح فرق الدعم إشارات أفضل، ما يعني وقتاً أطول للمساعدة ووقتاً أقل لملاحقة المعلومات.",
      },
    ],
    cta: {
      title: "هل أنت مستعد لجعل التوظيف الميسر أكثر احترافية وواقعية وقابلية للقياس؟",
      description:
        "انضم إلى HandiTalents لربط المواهب وأصحاب العمل وفرق الدعم ضمن رحلة توظيف أكثر وعياً وتنظيماً.",
    },
    footer: {
      description:
        "HandiTalents منصة توظيف شاملة تساعد الأشخاص ذوي الإعاقة وأصحاب العمل وفرق الدعم على بناء مسارات مهنية أفضل معاً.",
      platformTitle: "المنصة",
      features: "الميزات",
      journey: "المسار",
      stories: "قصص وتجارب",
      teamsTitle: "للفرق",
      employers: "أصحاب العمل",
      candidates: "المرشحون",
      partnerships: "الشراكات",
      contactTitle: "تواصل",
      location: "تونس، تونس",
    },
  },
};

function LandingIcon({ icon }: { icon: LandingIconName }) {
  switch (icon) {
    case "match":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
          <path d="M17 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
          <path d="M10.2 10.3 14.6 7" />
          <path d="M10.3 13.9 16.7 17.4" />
          <path d="M17 14.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
        </svg>
      );
    case "workspace":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
          <path d="M3.5 10.5h17" />
          <path d="M8 14h3" />
          <path d="M14 14h2.5" />
        </svg>
      );
    case "support":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20.5s-6.5-3.6-6.5-9.2a4 4 0 0 1 6.5-3.1 4 4 0 0 1 6.5 3.1c0 5.6-6.5 9.2-6.5 9.2Z" />
          <path d="M9.5 12.2h5" />
          <path d="M12 9.7v5" />
        </svg>
      );
    case "access":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="2" />
          <path d="M4.5 8.5h15" />
          <path d="M12 7.5v11" />
          <path d="m8.3 19 3.7-6 3.7 6" />
        </svg>
      );
  }
}

export default function HomePage() {
  const { locale, dir, locales, setLocale, t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const content = landingContent[locale];
  const currentLanguageLabel = t(`common.languages.${locale}`);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleAccessibilityOpen = () => {
    setSettingsOpen(false);
    triggerAccessibilityPanel("open");
  };

  return (
    <div className="ht-landing" dir={dir}>
      <div className="ht-ambient ht-ambient-left" aria-hidden="true" />
      <div className="ht-ambient ht-ambient-right" aria-hidden="true" />
      <div className="ht-ambient ht-ambient-bottom" aria-hidden="true" />

      <div className="ht-topbar">
        <div className="ht-container ht-topbar-inner">
          <div className="ht-topbar-links">
            <a href="mailto:contact@handitalents.com">contact@handitalents.com</a>
            <a href="tel:+21650370046">+216 50 370 046</a>
          </div>
          <div className="ht-topbar-pill">{content.topbarPill}</div>
        </div>
      </div>

      <header className="ht-header-wrap">
        <div className="ht-container">
          <div className="ht-header-pill">
            <Link href="/" className="ht-brand" aria-label={content.brandAriaLabel}>
              <Image
                src="/branding/logo-handitalents.png"
                alt="HandiTalents"
                width={148}
                height={42}
                className="ht-brand-logo"
                priority
              />
            </Link>

            <nav className="ht-nav" aria-label="Primary">
              {content.navItems.map((item) => (
                <a key={item.href} href={item.href} className={`ht-nav-link ${item.href === "#hero" ? "ht-nav-link-active" : ""}`}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="ht-header-actions">
              <div className="ht-settings-shell" ref={settingsRef}>
                <button
                  type="button"
                  className={`ht-settings-trigger ${settingsOpen ? "ht-settings-trigger-open" : ""}`}
                  onClick={() => setSettingsOpen((current) => !current)}
                  aria-label={content.actions.settings}
                  aria-haspopup="menu"
                  aria-expanded={settingsOpen}
                  aria-controls="ht-settings-menu"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3.2" />
                    <path d="M12 2.8v2.3" />
                    <path d="M12 18.9v2.3" />
                    <path d="m18.6 5.4-1.6 1.6" />
                    <path d="m7 17-1.6 1.6" />
                    <path d="M21.2 12h-2.3" />
                    <path d="M5.1 12H2.8" />
                    <path d="m18.6 18.6-1.6-1.6" />
                    <path d="M7 7 5.4 5.4" />
                  </svg>
                </button>

                {settingsOpen ? (
                  <div id="ht-settings-menu" className="ht-settings-menu" aria-label={content.actions.settings}>
                    <div className="ht-settings-item ht-settings-item-language">
                      <span className="ht-settings-item-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="8.5" />
                          <path d="M3.8 12h16.4" />
                          <path d="M12 3.5c2.7 2.7 4.3 5.6 4.3 8.5S14.7 17.8 12 20.5c-2.7-2.7-4.3-5.6-4.3-8.5S9.3 6.2 12 3.5Z" />
                        </svg>
                      </span>
                      <span className="ht-settings-item-copy">
                        <span className="ht-settings-item-title">{t("common.language")}</span>
                        <span className="ht-settings-item-meta">{currentLanguageLabel}</span>
                      </span>
                      <span className="ht-settings-item-tail" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m7 4 6 6-6 6" />
                        </svg>
                      </span>
                      <select
                        className="ht-settings-select-overlay"
                        value={locale}
                        onChange={(event) => {
                          setLocale(event.target.value as Locale);
                          setSettingsOpen(false);
                        }}
                        aria-label={t("common.language")}
                      >
                        {locales.map((item) => (
                          <option key={item} value={item}>
                            {t(`common.languages.${item}`)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ht-settings-divider" aria-hidden="true" />

                    <button
                      type="button"
                      className="ht-settings-item ht-settings-item-button"
                      onClick={handleAccessibilityOpen}
                      aria-label={content.actions.accessibilityHint}
                    >
                      <span className="ht-settings-item-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="5" r="1.8" />
                          <path d="M12 7.7v4.1" />
                          <path d="M8.8 10.7h6.4" />
                          <path d="M10.1 19.1 12 13.9l1.9 5.2" />
                          <path d="M7.8 21c1-1.4 2.5-2.2 4.2-2.2S15.2 19.6 16.2 21" />
                        </svg>
                      </span>
                      <span className="ht-settings-item-copy">
                        <span className="ht-settings-item-title">{content.actions.accessibility}</span>
                        <span className="ht-settings-item-meta">{content.actions.accessibilityHint}</span>
                      </span>
                      <span className="ht-settings-item-tail" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m7 4 6 6-6 6" />
                        </svg>
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
              <Link href="/connexion" className="ht-text-link">
                {content.actions.login}
              </Link>
              <Link href="/inscription" className="ht-btn ht-btn-primary">
                {content.actions.createAccount}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="ht-container ht-main">
        <section id="hero" className="ht-hero" aria-label="Hero">
          <div className="ht-hero-card">
            <div className="ht-hero-copy">
              <div className="ht-pill-row">
                <span className="ht-pill ht-pill-soft">{content.hero.eyebrow}</span>
              </div>

              <h1>
                {content.hero.title} <span>{content.hero.highlight}</span>
              </h1>

              <p>{content.hero.description}</p>

              <div className="ht-hero-actions">
                <Link href="/inscription" className="ht-btn ht-btn-primary ht-btn-large">
                  {content.actions.createAccount}
                </Link>
                <Link href="/inscription/entreprise" className="ht-btn ht-btn-secondary ht-btn-large">
                  {content.actions.employer}
                </Link>
              </div>

              <div className="ht-hero-note-row" aria-label="Hero highlights">
                {content.hero.notes.map((note) => (
                  <span key={note} className="ht-hero-note">
                    {note}
                  </span>
                ))}
              </div>
            </div>

            <div className="ht-hero-visual">
              <div className="ht-hero-visual-glow" aria-hidden="true" />
              <div className="ht-hero-stage">
                <div className="ht-hero-plane" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M3.5 11.8 20.5 4.5l-5.8 15-3.2-5-5 3.2 1.1-5.5-4.1-.4Z" />
                  </svg>
                </div>

                <div className="ht-hero-photo-frame">
                  <Image
                    src={heroImageSrc}
                    alt={content.hero.imageAlt}
                    width={1024}
                    height={1024}
                    className="ht-hero-photo"
                    priority
                  />
                </div>
              </div>

              <article className="ht-float-card ht-float-card-match">
                <span className="ht-card-eyebrow">{content.hero.matchEyebrow}</span>
                <div className="ht-match-row">
                  <div>
                    <strong>{content.hero.matchRole}</strong>
                    <span className="ht-company-line">{content.hero.matchCompany}</span>
                  </div>
                  <span className="ht-match-score">{content.hero.matchScore}</span>
                </div>
              </article>

              <article className="ht-float-card ht-float-card-stats">
                <ul className="ht-stats-list" aria-label="Platform impact stats">
                  {content.hero.stats.map((item) => (
                    <li key={item.label} className="ht-stats-item">
                      <span className={`ht-stat-icon ht-stat-icon-${item.tone}`} aria-hidden="true" />
                      <div className="ht-stat-copy">
                        <strong>{item.value}</strong>
                        <span>{item.label}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="ht-float-card ht-float-card-progress">
                <span className="ht-card-eyebrow">{content.hero.progressEyebrow}</span>
                <strong>{content.hero.progressTitle}</strong>
                <div className="ht-progress-track" aria-hidden="true">
                  <span className="ht-progress-fill" />
                </div>
                <div className="ht-progress-footer">
                  <div className="ht-avatar-group" aria-label="Interview panel">
                    {progressAvatars.map((avatarClass, index) => (
                      <span
                        key={avatarClass}
                        className={`ht-avatar-photo ${avatarClass}`}
                        aria-label={`Team member ${index + 1}`}
                      />
                    ))}
                  </div>
                  <span>{content.hero.progressPercent}</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="platform" className="ht-section" aria-label="Platform features">
          <div className="ht-section-header">
            <span className="ht-section-kicker">{content.platform.kicker}</span>
            <h2>{content.platform.title}</h2>
            <p>{content.platform.description}</p>
          </div>

          <div className="ht-feature-grid">
            {content.features.map((feature) => (
              <article key={feature.title} className="ht-feature-card">
                <div className="ht-feature-icon" aria-hidden="true">
                  <LandingIcon icon={feature.icon} />
                </div>
                <span className="ht-feature-label">{feature.label}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="journey" className="ht-section" aria-label="How HandiTalents works">
          <div className="ht-section-header">
            <span className="ht-section-kicker">{content.journey.kicker}</span>
            <h2>{content.journey.title}</h2>
            <p>{content.journey.description}</p>
          </div>

          <div className="ht-step-grid">
            {content.steps.map((step) => (
              <article key={step.step} className="ht-step-card">
                <span className="ht-step-index">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <div className="ht-step-preview" aria-hidden="true">
                  <span>{step.previewLabel}</span>
                  <strong>{step.previewValue}</strong>
                  <div className="ht-step-bars">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ht-impact-band" aria-label={content.impactAriaLabel}>
          {content.impactStats.map((item) => (
            <article key={item.label} className="ht-impact-item">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </section>

        <section id="community" className="ht-section" aria-label="Community feedback">
          <div className="ht-section-header">
            <span className="ht-section-kicker">{content.community.kicker}</span>
            <h2>{content.community.title}</h2>
          </div>

          <div className="ht-testimonial-grid">
            {content.testimonials.map((testimonial) => (
              <article key={testimonial.name} className="ht-testimonial-card">
                <span className="ht-quote-mark" aria-hidden="true">
                  &ldquo;
                </span>
                <span className="ht-testimonial-badge">{testimonial.badge}</span>
                <p>{testimonial.quote}</p>
                <div className="ht-testimonial-meta">
                  <span className="ht-testimonial-avatar" aria-hidden="true">
                    {testimonial.initials}
                  </span>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ht-cta-band" aria-label="Call to action">
          <div className="ht-cta-copy">
            <h2>{content.cta.title}</h2>
            <p>{content.cta.description}</p>
          </div>
          <div className="ht-cta-actions">
            <Link href="/inscription" className="ht-btn ht-btn-light">
              {content.actions.createAccount}
            </Link>
            <a href="mailto:contact@handitalents.com" className="ht-btn ht-btn-outline-light">
              {content.actions.talkToTeam}
            </a>
          </div>
        </section>
      </main>

      <footer className="ht-footer">
        <div className="ht-container ht-footer-shell">
          <div className="ht-footer-brand">
            <Image
              src="/branding/logo-handitalents.png"
              alt="HandiTalents"
              width={148}
              height={42}
              className="ht-brand-logo"
            />
            <p>{content.footer.description}</p>
          </div>

          <div className="ht-footer-column">
            <h3>{content.footer.platformTitle}</h3>
            <a href="#platform">{content.footer.features}</a>
            <a href="#journey">{content.footer.journey}</a>
            <a href="#community">{content.footer.stories}</a>
          </div>

          <div className="ht-footer-column">
            <h3>{content.footer.teamsTitle}</h3>
            <Link href="/inscription/entreprise">{content.footer.employers}</Link>
            <Link href="/inscription/candidat">{content.footer.candidates}</Link>
            <a href="mailto:contact@handitalents.com">{content.footer.partnerships}</a>
          </div>

          <div className="ht-footer-column">
            <h3>{content.footer.contactTitle}</h3>
            <a href="mailto:contact@handitalents.com">contact@handitalents.com</a>
            <a href="tel:+21650370046">+216 50 370 046</a>
            <span>{content.footer.location}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
